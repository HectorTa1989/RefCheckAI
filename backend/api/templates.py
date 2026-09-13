"""Question templates API."""
from fastapi import APIRouter, HTTPException, Header
from models.schemas import TemplateCreate, TemplateUpdate, TemplateOut
from db.client import db

router = APIRouter(prefix="/api/templates", tags=["templates"])


def _require_user(x: str | None) -> str:
    if not x:
        raise HTTPException(401, "Missing X-User-Id header")
    return x


@router.get("", response_model=list[TemplateOut])
def list_templates(x_user_id: str | None = Header(default=None)):
    uid = _require_user(x_user_id)
    # Return system templates + user's own
    res = (
        db().table("question_templates")
        .select("*")
        .or_(f"is_system.eq.true,recruiter_id.eq.{uid}")
        .order("is_system", desc=True)
        .order("name")
        .execute()
    )
    return res.data


@router.post("", response_model=TemplateOut, status_code=201)
def create_template(
    body: TemplateCreate,
    x_user_id: str | None = Header(default=None),
):
    uid = _require_user(x_user_id)
    row = {
        **body.model_dump(),
        "recruiter_id": uid,
        "is_system": False,
        "is_default": False,
    }
    res = db().table("question_templates").insert(row).execute()
    return res.data[0]


@router.patch("/{template_id}", response_model=TemplateOut)
def update_template(
    template_id: str,
    body: TemplateUpdate,
    x_user_id: str | None = Header(default=None),
):
    uid = _require_user(x_user_id)
    # Only update own (non-system) templates
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    res = (
        db().table("question_templates")
        .update(patch)
        .eq("id", template_id)
        .eq("recruiter_id", uid)
        .eq("is_system", False)
        .execute()
    )
    if not res.data:
        raise HTTPException(403, "Cannot edit system templates")
    return res.data[0]


@router.delete("/{template_id}", status_code=204)
def delete_template(
    template_id: str,
    x_user_id: str | None = Header(default=None),
):
    uid = _require_user(x_user_id)
    db().table("question_templates").delete().eq("id", template_id).eq("recruiter_id", uid).eq("is_system", False).execute()
