"""Public read-only reference reports, addressed by share token.

The recruiter toggles sharing on a candidate; that mints a `share_token` UUID
which is the only credential for these endpoints. Nothing here requires auth, so
each handler must re-check `share_enabled` on every request — revoking a share
has to take effect immediately.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from db.client import db
from services.report_service import generate_pdf_bytes

router = APIRouter(prefix="/api/shared", tags=["shared"])

# Deliberately narrow: a public viewer sees the assessment, never the
# referee's phone number or email, and never the recruiter's account id.
CANDIDATE_FIELDS = (
    "id, name, role_applied_for, company_name, status, overall_score, "
    "recommendation, completed_at, created_at"
)
REFERENCE_FIELDS = (
    "id, referee_name, relationship, company_at_time, call_status, call_outcome, "
    "referee_enthusiasm, overall_reference_score, would_rehire, "
    "call_duration_seconds, answers, strengths, red_flags, notable_quotes, "
    "summary, completed_at"
)


def _load_shared_candidate(share_token: str) -> dict:
    res = (
        db().table("candidates")
        .select(CANDIDATE_FIELDS)
        .eq("share_token", share_token)
        .eq("share_enabled", True)
        .execute()
    )
    if not res.data:
        # Same response whether the token is wrong or sharing was revoked.
        raise HTTPException(404, "This report is not available")
    return res.data[0]


@router.get("/{share_token}")
def get_shared_report(share_token: str):
    candidate = _load_shared_candidate(share_token)
    if candidate["status"] != "complete":
        raise HTTPException(404, "This report is not available")

    refs = (
        db().table("references")
        .select(REFERENCE_FIELDS)
        .eq("candidate_id", candidate["id"])
        .execute()
    ).data or []

    return {**candidate, "references": refs}


@router.get("/{share_token}/pdf")
def download_shared_pdf(share_token: str):
    candidate = _load_shared_candidate(share_token)
    if candidate["status"] != "complete":
        raise HTTPException(404, "This report is not available")

    refs = (
        db().table("references")
        .select("*")
        .eq("candidate_id", candidate["id"])
        .execute()
    ).data or []

    pdf = generate_pdf_bytes(candidate, refs)
    safe_name = candidate["name"].replace(" ", "_")
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="RefCheck_{safe_name}.pdf"'},
    )
