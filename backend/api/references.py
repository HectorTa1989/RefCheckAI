"""References API — add/edit/delete referee records."""
from __future__ import annotations
from fastapi import APIRouter, HTTPException, Header
from models.schemas import ReferenceCreate, ReferenceUpdate, ReferenceOut
from db.client import db

router = APIRouter(prefix="/api/references", tags=["references"])


def _require_user(x_user_id: str | None) -> str:
    if not x_user_id:
        raise HTTPException(401, "Missing X-User-Id header")
    return x_user_id


def _assert_candidate_owner(candidate_id: str, uid: str):
    res = (
        db().table("candidates")
        .select("id")
        .eq("id", candidate_id)
        .eq("recruiter_id", uid)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(403, "Forbidden")


# ── List refs for a candidate ─────────────────────────────────────────────────

@router.get("/by-candidate/{candidate_id}", response_model=list[ReferenceOut])
def list_references(
    candidate_id: str,
    x_user_id: str | None = Header(default=None),
):
    uid = _require_user(x_user_id)
    _assert_candidate_owner(candidate_id, uid)
    res = (
        db().table("references")
        .select("*")
        .eq("candidate_id", candidate_id)
        .order("created_at")
        .execute()
    )
    return res.data


# ── Add reference ─────────────────────────────────────────────────────────────

@router.post("/{candidate_id}", response_model=ReferenceOut, status_code=201)
def add_reference(
    candidate_id: str,
    body: ReferenceCreate,
    x_user_id: str | None = Header(default=None),
):
    uid = _require_user(x_user_id)
    _assert_candidate_owner(candidate_id, uid)

    # Max 4 references
    count_res = (
        db().table("references")
        .select("id", count="exact")
        .eq("candidate_id", candidate_id)
        .execute()
    )
    if (count_res.count or 0) >= 4:
        raise HTTPException(400, "Maximum 4 references per candidate")

    row = {**body.model_dump(), "candidate_id": candidate_id}
    res = db().table("references").insert(row).execute()
    return res.data[0]


# ── Update reference ──────────────────────────────────────────────────────────

@router.patch("/{reference_id}", response_model=ReferenceOut)
def update_reference(
    reference_id: str,
    body: ReferenceUpdate,
    x_user_id: str | None = Header(default=None),
):
    uid = _require_user(x_user_id)

    # Confirm ownership via candidate
    ref_res = (
        db().table("references")
        .select("candidate_id")
        .eq("id", reference_id)
        .single()
        .execute()
    )
    if not ref_res.data:
        raise HTTPException(404)
    _assert_candidate_owner(ref_res.data["candidate_id"], uid)

    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    res = db().table("references").update(patch).eq("id", reference_id).execute()
    return res.data[0]


# ── Delete reference ──────────────────────────────────────────────────────────

@router.delete("/{reference_id}", status_code=204)
def delete_reference(
    reference_id: str,
    x_user_id: str | None = Header(default=None),
):
    uid = _require_user(x_user_id)
    ref_res = (
        db().table("references")
        .select("candidate_id")
        .eq("id", reference_id)
        .single()
        .execute()
    )
    if not ref_res.data:
        raise HTTPException(404)
    _assert_candidate_owner(ref_res.data["candidate_id"], uid)
    db().table("references").delete().eq("id", reference_id).execute()
