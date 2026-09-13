"""Pydantic v2 schemas for request/response validation."""
from __future__ import annotations
from typing import Optional, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, field_validator, model_validator
from enum import Enum


# ── Enums ────────────────────────────────────────────────────────────────────

class CandidateStatus(str, Enum):
    draft = "draft"
    pending = "pending"
    in_progress = "in_progress"
    complete = "complete"
    cancelled = "cancelled"


class RecommendationType(str, Enum):
    strong_yes = "strong_yes"
    yes = "yes"
    neutral = "neutral"
    no = "no"
    strong_no = "strong_no"


class CallStatus(str, Enum):
    queued = "queued"
    calling = "calling"
    completed = "completed"
    failed = "failed"
    no_answer = "no_answer"
    declined = "declined"


class EnthusiasmLevel(str, Enum):
    very_enthusiastic = "very_enthusiastic"
    positive = "positive"
    neutral = "neutral"
    hesitant = "hesitant"
    negative = "negative"


# ── Question Template ────────────────────────────────────────────────────────

class QuestionItem(BaseModel):
    id: str
    text: str
    type: str = "open"
    follow_up: Optional[str] = None


class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    questions: list[QuestionItem]


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[list[QuestionItem]] = None


class TemplateOut(BaseModel):
    id: UUID
    recruiter_id: Optional[UUID]
    name: str
    description: Optional[str]
    questions: list[QuestionItem]
    is_default: bool
    is_system: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Candidate ────────────────────────────────────────────────────────────────

class CandidateCreate(BaseModel):
    name: str
    email: Optional[str] = None
    role_applied_for: str
    company_name: str
    job_description_summary: Optional[str] = None
    template_id: Optional[UUID] = None


class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role_applied_for: Optional[str] = None
    company_name: Optional[str] = None
    job_description_summary: Optional[str] = None
    template_id: Optional[UUID] = None


class CandidateOut(BaseModel):
    id: UUID
    recruiter_id: UUID
    name: str
    email: Optional[str]
    role_applied_for: str
    company_name: str
    job_description_summary: Optional[str]
    template_id: Optional[UUID]
    status: CandidateStatus
    overall_score: Optional[float]
    recommendation: Optional[RecommendationType]
    share_token: Optional[UUID]
    share_enabled: bool
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Reference ────────────────────────────────────────────────────────────────

class ReferenceCreate(BaseModel):
    referee_name: str
    referee_phone: str
    referee_email: Optional[str] = None
    relationship: str
    company_at_time: Optional[str] = None

    @field_validator("referee_phone")
    @classmethod
    def _valid_e164(cls, v: str) -> str:
        # Reject at the API boundary, not at dial time. Non-ASCII confusables
        # are refused rather than transliterated: a look-alike digit is a
        # different destination.
        from services.phone import DestinationError, parse_user_phone
        try:
            return parse_user_phone(v)
        except DestinationError as exc:
            raise ValueError(str(exc)) from exc


class ReferenceUpdate(BaseModel):
    referee_name: Optional[str] = None
    referee_phone: Optional[str] = None

    @field_validator("referee_phone")
    @classmethod
    def _valid_e164(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        from services.phone import DestinationError, parse_user_phone
        try:
            return parse_user_phone(v)
        except DestinationError as exc:
            raise ValueError(str(exc)) from exc
    referee_email: Optional[str] = None
    relationship: Optional[str] = None
    company_at_time: Optional[str] = None


class AnswerItem(BaseModel):
    text: str = ""
    score: Optional[int] = None  # 1-5; None when the referee did not answer

    @model_validator(mode="before")
    @classmethod
    def _accept_calle_shape(cls, data: Any) -> Any:
        # Rows persisted before normalisation hold CALL-E's {response, rating}.
        if isinstance(data, dict):
            from services.calle_service import normalize_answer
            return normalize_answer(data)
        return data

    @field_validator("score")
    @classmethod
    def score_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 5):
            raise ValueError("score must be 1-5")
        return v


class ReferenceOut(BaseModel):
    id: UUID
    candidate_id: UUID
    referee_name: str
    referee_phone: str
    referee_email: Optional[str]
    relationship: str
    company_at_time: Optional[str]
    call_status: CallStatus
    calle_call_sid: Optional[str]
    transcript: Optional[str]
    answers: Optional[dict[str, AnswerItem]]
    red_flags: Optional[list[str]]
    strengths: Optional[list[str]]
    notable_quotes: Optional[list[str]]
    referee_enthusiasm: Optional[EnthusiasmLevel]
    overall_reference_score: Optional[float]
    would_rehire: Optional[bool]
    call_duration_seconds: Optional[int]
    call_outcome: Optional[str]
    spoke_with_referee: Optional[bool]
    summary: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ── CALL-E Webhook ───────────────────────────────────────────────────────────
#
# Terminal event envelope: https://docs.heycall-e.com/webhooks
# `data` is the same snapshot as GET /v1/calls/{call_id}. The receiver in
# api/calle_webhook.py re-fetches that snapshot rather than trusting the body,
# so this model only describes the envelope.

class CalleWebhookEvent(BaseModel):
    id: str
    type: str                       # call.completed | call.failed | call.result_validation_failed
    created_at: Optional[datetime] = None
    data: dict[str, Any] = {}


# ── Composite response ───────────────────────────────────────────────────────

class CandidateWithRefs(CandidateOut):
    references: list[ReferenceOut] = []
    template: Optional[TemplateOut] = None
