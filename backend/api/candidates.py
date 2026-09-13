"""Candidates API — CRUD + launch reference checks."""
from __future__ import annotations
from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from models.schemas import (
    CandidateCreate, CandidateUpdate, CandidateOut, CandidateWithRefs,
)
from db.client import db, get_settings
from services.calle_service import dispatch_all_calls
from api.calle_webhook import sync_candidate_calls

router = APIRouter(prefix="/api/candidates", tags=["candidates"])
settings = get_settings()


def _require_user(x_user_id: str | None) -> str:
    if not x_user_id:
        raise HTTPException(401, "Missing X-User-Id header")
    return x_user_id


# ── List ─────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[CandidateOut])
def list_candidates(x_user_id: str | None = Header(default=None)):
    uid = _require_user(x_user_id)
    res = (
        db().table("candidates")
        .select("*")
        .eq("recruiter_id", uid)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


# ── Create ───────────────────────────────────────────────────────────────────

@router.post("", response_model=CandidateOut, status_code=201)
def create_candidate(
    body: CandidateCreate,
    x_user_id: str | None = Header(default=None),
):
    uid = _require_user(x_user_id)
    row = {**body.model_dump(), "recruiter_id": uid, "status": "draft"}
    res = db().table("candidates").insert(row).execute()
    return res.data[0]


# ── Get ──────────────────────────────────────────────────────────────────────

@router.get("/{candidate_id}", response_model=CandidateWithRefs)
def get_candidate(
    candidate_id: str,
    x_user_id: str | None = Header(default=None),
):
    uid = _require_user(x_user_id)
    c_res = (
        db().table("candidates")
        .select("*")
        .eq("id", candidate_id)
        .eq("recruiter_id", uid)
        .single()
        .execute()
    )
    if not c_res.data:
        raise HTTPException(404, "Candidate not found")

    r_res = (
        db().table("references")
        .select("*")
        .eq("candidate_id", candidate_id)
        .order("created_at")
        .execute()
    )

    t_res = None
    if c_res.data.get("template_id"):
        t_res = (
            db().table("question_templates")
            .select("*")
            .eq("id", c_res.data["template_id"])
            .single()
            .execute()
        )

    return {
        **c_res.data,
        "references": r_res.data or [],
        "template": t_res.data if t_res else None,
    }


# ── Update ───────────────────────────────────────────────────────────────────

@router.patch("/{candidate_id}", response_model=CandidateOut)
def update_candidate(
    candidate_id: str,
    body: CandidateUpdate,
    x_user_id: str | None = Header(default=None),
):
    uid = _require_user(x_user_id)
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    res = (
        db().table("candidates")
        .update(patch)
        .eq("id", candidate_id)
        .eq("recruiter_id", uid)
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "Candidate not found")
    return res.data[0]


# ── Delete ───────────────────────────────────────────────────────────────────

@router.delete("/{candidate_id}", status_code=204)
def delete_candidate(
    candidate_id: str,
    x_user_id: str | None = Header(default=None),
):
    uid = _require_user(x_user_id)
    db().table("candidates").delete().eq("id", candidate_id).eq("recruiter_id", uid).execute()


# ── Start checks ──────────────────────────────────────────────────────────────

@router.post("/{candidate_id}/start")
async def start_checks(
    candidate_id: str,
    background_tasks: BackgroundTasks,
    x_user_id: str | None = Header(default=None),
):
    uid = _require_user(x_user_id)

    # Fetch candidate
    c_res = (
        db().table("candidates")
        .select("*")
        .eq("id", candidate_id)
        .eq("recruiter_id", uid)
        .single()
        .execute()
    )
    if not c_res.data:
        raise HTTPException(404, "Candidate not found")
    candidate = c_res.data

    # Fetch references
    r_res = (
        db().table("references")
        .select("*")
        .eq("candidate_id", candidate_id)
        .execute()
    )
    references = r_res.data or []
    if not references:
        raise HTTPException(400, "Add at least one reference before starting")

    # Fetch questions
    template_id = candidate.get("template_id")
    if template_id:
        t_res = (
            db().table("question_templates")
            .select("questions")
            .eq("id", template_id)
            .single()
            .execute()
        )
        questions = t_res.data.get("questions", []) if t_res.data else []
    else:
        # Fallback: fetch default system template
        t_res = (
            db().table("question_templates")
            .select("questions")
            .eq("is_default", True)
            .single()
            .execute()
        )
        questions = t_res.data.get("questions", []) if t_res.data else []

    if not questions:
        raise HTTPException(500, "No question template available")

    # Set candidate → in_progress
    db().table("candidates").update({"status": "in_progress"}).eq("id", candidate_id).execute()

    # Set all refs → queued
    for ref in references:
        db().table("references").update({"call_status": "queued"}).eq("id", ref["id"]).execute()

    # CALL-E places each call on its own line, so they all go out at once.
    background_tasks.add_task(_fire_calls, references, candidate, questions)

    return {"status": "dispatched", "reference_count": len(references)}


async def _fire_calls(references: list[dict], candidate: dict, questions: list[dict]):
    """Create one CALL-E call task per reference; results arrive by webhook or /sync."""
    for ref_id, res in await dispatch_all_calls(references, candidate, questions):
        if res["error"]:
            db().table("references").update({
                "call_status": "failed",
                "call_outcome": "dispatch_failed",
                "summary": f"Could not place the call: {res['error']}",
            }).eq("id", ref_id).execute()
        else:
            db().table("references").update({
                "call_status": "calling",
                "calle_call_sid": res["call_id"],
            }).eq("id", ref_id).execute()


# ── Sync results ──────────────────────────────────────────────────────────────

@router.post("/{candidate_id}/sync")
def sync_checks(
    candidate_id: str,
    x_user_id: str | None = Header(default=None),
):
    """Pull finished calls from CALL-E for references still in flight.

    The check page calls this on Refresh and while it polls. With a public
    HTTPS backend it only heals missed webhooks; locally it is the delivery path.
    """
    uid = _require_user(x_user_id)
    owned = (
        db().table("candidates")
        .select("id")
        .eq("id", candidate_id)
        .eq("recruiter_id", uid)
        .execute()
    )
    if not owned.data:
        raise HTTPException(404, "Candidate not found")
    return sync_candidate_calls(candidate_id)


# ── Share toggle ──────────────────────────────────────────────────────────────

@router.post("/{candidate_id}/share")
def toggle_share(
    candidate_id: str,
    x_user_id: str | None = Header(default=None),
):
    uid = _require_user(x_user_id)
    c_res = (
        db().table("candidates")
        .select("share_enabled, share_token")
        .eq("id", candidate_id)
        .eq("recruiter_id", uid)
        .single()
        .execute()
    )
    if not c_res.data:
        raise HTTPException(404)

    new_state = not c_res.data["share_enabled"]
    db().table("candidates").update({"share_enabled": new_state}).eq("id", candidate_id).execute()

    share_url = (
        f"{settings.app_url}/shared/{c_res.data['share_token']}"
        if new_state else None
    )
    return {"share_enabled": new_state, "share_url": share_url}
