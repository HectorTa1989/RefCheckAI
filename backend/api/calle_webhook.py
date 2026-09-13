"""CALL-E terminal webhook receiver.

Trust model — CALL-E webhooks are NOT signed (there is no webhook secret,
`CALL-E-Timestamp` or `CALL-E-Signature` header; the SDK's `webhooks.verify`
and `webhooks.unwrap` are retained only for legacy signing layers). So this
endpoint treats every delivery as untrusted input and does three things:

  1. serves on an unguessable path token,
  2. requires `CALL-E-Event-Id` to match the body's `event.id`,
  3. re-fetches `GET /v1/calls/{call_id}` with our API key and acts on *that*
     snapshot, never on the posted body.

Delivery is at-least-once, so the event id is recorded before any side effect
and duplicates return 200 without reprocessing.

`sync_candidate_calls` is the reconciliation path for the same result: it
pulls terminal calls from the API for references still in flight. It heals a
missed delivery, and it is how results arrive at all when the backend has no
public HTTPS URL for CALL-E to post to (local development).
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request

from db.client import db, get_settings
from services.calle_service import (
    OUTCOME_TO_STATUS,
    compute_candidate_score,
    compute_reference_score,
    enthusiasm_for_db,
    extract_duration_seconds,
    extract_provider_call_id,
    extract_transcript,
    get_calle,
    normalize_answers,
    rehire_to_bool,
    score_to_recommendation,
)
from services.email_service import send_check_complete_email

router = APIRouter(prefix="/api/calle", tags=["calle"])
settings = get_settings()

TERMINAL_EVENTS = {"call.completed", "call.failed", "call.result_validation_failed"}
TERMINAL_STATUSES = {"completed", "failed", "canceled"}
# Our own `call_status` values for a reference whose call has not come back.
IN_FLIGHT = {"queued", "calling"}


@router.post("/webhook/{token}")
async def calle_webhook(
    token: str,
    request: Request,
    background_tasks: BackgroundTasks,
    calle_event_id: str | None = Header(default=None, alias="CALL-E-Event-Id"),
):
    if token != settings.calle_webhook_token:
        raise HTTPException(404, "Not found")

    try:
        event = json.loads(await request.body())
    except ValueError:
        raise HTTPException(400, "Malformed JSON")
    if not isinstance(event, dict):
        raise HTTPException(400, "Event must be a JSON object")

    event_id = event.get("id")
    event_type = event.get("type")

    # The event id header must corroborate the body (docs: "Receive events").
    if not calle_event_id or calle_event_id != event_id:
        raise HTTPException(400, "Missing or mismatched CALL-E-Event-Id")

    if event_type not in TERMINAL_EVENTS:
        # Unknown/non-terminal type: ack so CALL-E stops retrying.
        return {"ok": True, "ignored": event_type}

    call_id = ((event.get("data") or {}).get("id")) or ""
    if not call_id:
        raise HTTPException(400, "Event data is missing a call id")

    # At-least-once delivery — claim the event before doing anything.
    if not _claim_event(event_id, event_type, call_id):
        return {"ok": True, "duplicate": True}

    # Never trust the posted body for a side effect: re-read the call from the API.
    try:
        call = get_calle().calls.get(call_id)
    except Exception as exc:
        _release_event(event_id)
        # 5xx so CALL-E retries — a transient API blip must not lose the result.
        raise HTTPException(502, f"Could not verify call {call_id}: {exc}")

    if call.get("status") not in TERMINAL_STATUSES:
        _release_event(event_id)
        raise HTTPException(409, "Call is not in a terminal state yet")

    reference_id = str((call.get("metadata") or {}).get("reference_id") or "")
    if not reference_id:
        return {"ok": True, "ignored": "no reference_id in metadata"}

    ref_res = (
        db().table("references").select("id, candidate_id").eq("id", reference_id).execute()
    )
    if not ref_res.data:
        return {"ok": True, "ignored": f"unknown reference {reference_id}"}
    candidate_id = ref_res.data[0]["candidate_id"]

    score = _persist_reference_result(reference_id, call)

    if _all_references_terminal(candidate_id):
        background_tasks.add_task(finalize_candidate, candidate_id)

    return {"ok": True, "reference_id": reference_id, "score": score}


# ── Event de-duplication ─────────────────────────────────────────────────────

def _claim_event(event_id: str, event_type: str, call_id: str) -> bool:
    """Insert the event id. False when it was already recorded."""
    try:
        db().table("calle_webhook_events").insert(
            {"event_id": event_id, "event_type": event_type, "call_id": call_id}
        ).execute()
        return True
    except Exception:
        # Unique-violation on event_id — a duplicate delivery.
        return False


def _release_event(event_id: str) -> None:
    """Un-claim so CALL-E's retry can be processed."""
    try:
        db().table("calle_webhook_events").delete().eq("event_id", event_id).execute()
    except Exception:
        pass


# ── Persistence ──────────────────────────────────────────────────────────────

def _persist_reference_result(reference_id: str, call: dict[str, Any]) -> float | None:
    """Write one terminal call onto its reference row. Returns the score."""
    result = call.get("structured_result") or {}
    recipient = (call.get("recipients") or [{}])[0]

    # Whole-task result is authoritative; fall back to the recipient result.
    if not result:
        result = recipient.get("structured_result") or {}

    answers = result.get("answers") or {}
    enthusiasm = result.get("referee_enthusiasm")
    outcome = result.get("call_outcome")

    score = compute_reference_score(answers, enthusiasm)

    if call.get("status") != "completed":
        # A failed/canceled task produces no structured result. Do NOT infer
        # no_answer or declined from failure_code — the Calls API does not
        # guarantee those values (docs: "Accepted call execution outcomes").
        call_status = "failed"
    else:
        call_status = OUTCOME_TO_STATUS.get(outcome or "unknown", "completed")

    update: dict[str, Any] = {
        "call_status": call_status,
        "call_outcome": outcome,
        "spoke_with_referee": {"yes": True, "no": False}.get(
            result.get("spoke_with_referee") or ""
        ),
        "referee_enthusiasm": enthusiasm_for_db(enthusiasm),
        "would_rehire": rehire_to_bool(result.get("would_rehire")),
        # Stored as {text, score}: the shape the API schema, UI and PDF read.
        "answers": normalize_answers(answers),
        "strengths": result.get("strengths") or [],
        "red_flags": result.get("red_flags") or [],
        "notable_quotes": result.get("notable_quotes") or [],
        "summary": result.get("summary") or call.get("summary"),
        "overall_reference_score": score,
        "transcript": extract_transcript(call),
        "call_duration_seconds": extract_duration_seconds(call),
        "calle_call_sid": str(call.get("id") or ""),
        "calle_provider_call_id": extract_provider_call_id(call),
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }

    db().table("references").update(update).eq("id", reference_id).execute()
    return score


def _all_references_terminal(candidate_id: str) -> bool:
    rows = (
        db().table("references")
        .select("call_status")
        .eq("candidate_id", candidate_id)
        .execute()
    ).data or []
    terminal = {"completed", "declined", "no_answer", "failed"}
    return bool(rows) and all(r["call_status"] in terminal for r in rows)


def finalize_candidate(candidate_id: str) -> bool:
    """Aggregate reference scores, set the recommendation, notify the recruiter.

    Idempotent: the webhook and a sync can both see the last reference land,
    so the status flip is conditional and only the caller that performs it
    sends the email. Returns True when this call finalised the candidate.
    """
    rows = (
        db().table("references")
        .select("overall_reference_score")
        .eq("candidate_id", candidate_id)
        .execute()
    ).data or []

    scores = [
        float(r["overall_reference_score"])
        for r in rows
        if r.get("overall_reference_score") is not None
    ]
    overall = compute_candidate_score(scores)
    recommendation = score_to_recommendation(overall) if overall is not None else None

    flipped = (
        db().table("candidates").update(
            {
                "status": "complete",
                "overall_score": overall,
                "recommendation": recommendation,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", candidate_id)
        .neq("status", "complete")
        .execute()
    ).data
    if not flipped:
        return False  # already finalised by an earlier delivery or sync

    c_res = (
        db().table("candidates")
        .select("*, profiles!inner(email)")
        .eq("id", candidate_id)
        .single()
        .execute()
    )
    if not c_res.data:
        return True
    candidate = c_res.data

    try:
        send_check_complete_email(
            recruiter_email=(candidate.get("profiles") or {}).get("email", ""),
            candidate_name=candidate["name"],
            role=candidate["role_applied_for"],
            overall_score=overall or 0.0,
            recommendation=recommendation or "neutral",
            report_url=f"{settings.app_url.rstrip('/')}/checks/{candidate_id}",
        )
    except Exception:
        pass  # email is best-effort; the report is already saved

    try:
        db().table("audit_log").insert(
            {
                "recruiter_id": candidate["recruiter_id"],
                "action": "check_completed",
                "entity_type": "candidate",
                "entity_id": candidate_id,
                "metadata": {"score": overall, "recommendation": recommendation},
            }
        ).execute()
    except Exception:
        pass
    return True


# ── Reconciliation ───────────────────────────────────────────────────────────

def sync_candidate_calls(candidate_id: str) -> dict[str, Any]:
    """Pull terminal results for a candidate's in-flight calls from CALL-E.

    Same trust model as the webhook: state comes only from the API's own
    snapshot, and a call whose metadata names a different reference is
    refused rather than written onto this one.
    """
    rows = (
        db().table("references")
        .select("id, call_status, calle_call_sid")
        .eq("candidate_id", candidate_id)
        .execute()
    ).data or []

    updated: list[str] = []
    pending: list[str] = []
    errors: list[str] = []
    for ref in rows:
        ref_id = str(ref["id"])
        call_id = ref.get("calle_call_sid")
        if ref.get("call_status") not in IN_FLIGHT or not call_id:
            continue
        try:
            call = get_calle().calls.get(call_id)
        except Exception:
            errors.append(ref_id)  # transient; the next sync retries
            continue
        if str((call.get("metadata") or {}).get("reference_id") or "") != ref_id:
            errors.append(ref_id)
            continue
        if call.get("status") not in TERMINAL_STATUSES:
            pending.append(ref_id)
            continue
        _persist_reference_result(ref_id, call)
        updated.append(ref_id)

    finalized = _all_references_terminal(candidate_id) and finalize_candidate(candidate_id)
    return {"updated": updated, "pending": pending, "errors": errors, "finalized": finalized}
