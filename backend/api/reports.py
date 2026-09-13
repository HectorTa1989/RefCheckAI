"""PDF report download endpoint."""
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import Response
from db.client import db
from services.report_service import generate_pdf_bytes

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/{candidate_id}/pdf")
def download_pdf(
    candidate_id: str,
    user_id: str | None = None,
    x_user_id: str | None = Header(default=None),
):
    """Recruiter-only download.

    `window.open` cannot set headers, so the browser passes the id as a query
    param; API clients use the X-User-Id header. Public access goes through
    /api/shared/{share_token}/pdf instead — a candidate id is not a share
    credential.
    """
    uid = x_user_id or user_id
    if not uid:
        raise HTTPException(401, "Missing user id")

    c_res = (
        db().table("candidates")
        .select("*")
        .eq("id", candidate_id)
        .eq("recruiter_id", uid)
        .single()
        .execute()
    )

    if not c_res.data:
        raise HTTPException(404, "Report not found or not shared")

    candidate = c_res.data
    if candidate["status"] != "complete":
        raise HTTPException(400, "Reference check is not yet complete")

    r_res = (
        db().table("references")
        .select("*")
        .eq("candidate_id", candidate_id)
        .execute()
    )

    pdf_bytes = generate_pdf_bytes(candidate, r_res.data or [])
    safe_name = candidate["name"].replace(" ", "_")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="RefCheck_{safe_name}.pdf"'
        },
    )
