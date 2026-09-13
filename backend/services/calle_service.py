"""CALL-E integration — build the call task, dispatch it, and score what comes back.

Contract reference: https://docs.heycall-e.com
  - SDK:      pip install calle-ai  →  from calle import CalleClient
  - Base URL: https://api.heycall-e.com
  - Create:   client.calls.create(task=…, recipient=…, result_schema=…,
                                  metadata=…, webhook_url=…, idempotency_key=…)
  - Result:   CALL-E extracts and validates `structured_result` against
              `result_schema` server-side. It is None when no schema-valid
              result could be produced from the call evidence.
"""
from __future__ import annotations

import asyncio
from functools import lru_cache
from typing import Any

from calle import CalleClient
from calle.errors import CalleAPIError, CalleConnectionError, CalleTimeoutError

from db.client import get_settings
from services.phone import DestinationError, assert_authorized, mask

settings = get_settings()


@lru_cache()
def get_calle() -> CalleClient:
    """Process-wide CALL-E client. Server-side only — never expose the key."""
    return CalleClient(
        api_key=settings.calle_api_key,
        base_url=settings.calle_base_url,
        timeout=30.0,
    )


# ── Result schema ────────────────────────────────────────────────────────────
#
# The schema is an extraction contract, not a prompt: CALL-E runs it against the
# call transcript and refuses anything that does not validate. Enums carry their
# selection rules in `description`, because descriptions are what steer the
# extraction model — `type`/`enum`/`required` are what actually enforce it.

RATING_VALUES = ["1", "2", "3", "4", "5", "not_answered"]
_NUMERIC_RATINGS = {"1", "2", "3", "4", "5"}

# Questions that are more predictive get more weight in the final score.
WEIGHTS: dict[str, float] = {
    "q_rehire": 2.0,          # most predictive single answer in the call
    "q_strengths": 1.5,
    "q_achievement": 1.5,
    "q_fit": 1.5,
    "q_technical": 1.5,
    "q_results": 1.5,
    "q_quota": 1.5,
    "q_under_pressure": 1.2,
    "q_problem_solving": 1.2,
    "q_team_building": 1.2,
    "q_decision_making": 1.2,
    "q_collaboration": 1.0,
    "q_customer": 1.0,
    "q_objections": 1.0,
    "q_code_quality": 1.0,
    "q_strategic": 1.0,
    "q_conflict": 1.0,
    "q_coachability": 1.0,
    "q_learning": 1.0,
    "q_pipeline": 0.9,
    "q_cross_functional": 0.9,
    "q_relationship": 0.8,
    "q_role": 0.8,
    "q_areas_for_growth": 0.7,
}
DEFAULT_WEIGHT = 1.0

ENTHUSIASM_BONUS: dict[str, float] = {
    "very_enthusiastic": 0.5,
    "positive": 0.25,
    "neutral": 0.0,
    "hesitant": -0.25,
    "negative": -0.75,
    "unknown": 0.0,
}


def build_result_schema(questions: list[dict]) -> dict[str, Any]:
    """JSON Schema for one reference call, derived from the chosen template.

    Only features CALL-E supports are used: object/string/array, properties,
    required, enum, nested objects, description, additionalProperties: false.
    No $ref / oneOf / anyOf / allOf — those are rejected.
    """
    answer_props: dict[str, Any] = {}
    for q in questions:
        answer_props[q["id"]] = {
            "type": "object",
            "required": ["response", "rating"],
            "properties": {
                "response": {
                    "type": "string",
                    "description": (
                        "What the referee actually said in answer to: "
                        f"\"{q['text']}\". Summarise faithfully in one or two "
                        "sentences, keeping their own words where they matter. "
                        "Empty string if the question was never answered."
                    ),
                },
                "rating": {
                    "type": "string",
                    "enum": RATING_VALUES,
                    "description": (
                        "How positive the answer was, 1 (strongly negative) to "
                        "5 (strongly positive). Use 3 only for a genuinely "
                        "neutral answer. Use not_answered if the question was "
                        "skipped, deflected, or the referee declined to answer "
                        "— do not guess a middle rating in that case."
                    ),
                },
            },
            "additionalProperties": False,
        }

    return {
        "type": "object",
        "required": [
            "spoke_with_referee",
            "call_outcome",
            "referee_enthusiasm",
            "would_rehire",
            "answers",
            "strengths",
            "red_flags",
            "notable_quotes",
            "summary",
        ],
        "properties": {
            "spoke_with_referee": {
                "type": "string",
                "enum": ["yes", "no", "unknown"],
                "description": (
                    "Whether the person reached was the intended referee. Use no "
                    "for a wrong number, a colleague taking a message, or "
                    "voicemail. Use unknown if identity was never established."
                ),
            },
            "call_outcome": {
                "type": "string",
                "enum": [
                    "completed",
                    "only_confirmed_employment",
                    "declined",
                    "no_usable_answer",
                    "wrong_person",
                    "unknown",
                ],
                "description": (
                    "How the call ended. completed = the referee answered the "
                    "substantive questions. only_confirmed_employment = they "
                    "would confirm dates/title but nothing more, usually citing "
                    "company policy. declined = they refused to give a reference "
                    "at all. no_usable_answer = the call connected but produced "
                    "nothing usable. wrong_person = not the intended referee. "
                    "Use unknown only if none of these fit."
                ),
            },
            "referee_enthusiasm": {
                "type": "string",
                "enum": [
                    "very_enthusiastic",
                    "positive",
                    "neutral",
                    "hesitant",
                    "negative",
                    "unknown",
                ],
                "description": (
                    "Overall warmth of the referee toward the candidate, judged "
                    "on tone and willingness as much as words. Use hesitant when "
                    "they hedge, pause noticeably, or heavily qualify praise "
                    "(\"I think\", \"mostly\", \"generally\"). Use unknown if "
                    "there was not enough conversation to judge."
                ),
            },
            "would_rehire": {
                "type": "string",
                "enum": ["yes", "no", "qualified", "unknown"],
                "description": (
                    "Whether the referee would hire or work with the candidate "
                    "again. Use qualified when the yes carries a real condition "
                    "(\"in the right role\", \"with more support\"). Use unknown "
                    "if they were not asked or did not answer."
                ),
            },
            "answers": {
                "type": "object",
                "required": [q["id"] for q in questions],
                "properties": answer_props,
                "additionalProperties": False,
            },
            "strengths": {
                "type": "array",
                "items": {"type": "string"},
                "description": (
                    "Specific strengths the referee named, one per item, in their "
                    "framing. Empty array if none were given."
                ),
            },
            "red_flags": {
                "type": "array",
                "items": {"type": "string"},
                "description": (
                    "Concerns a hiring manager should see: reservations, "
                    "criticism, notable hesitation, or anything the referee "
                    "avoided answering. Empty array if none. Do not invent "
                    "concerns from a merely lukewarm tone."
                ),
            },
            "notable_quotes": {
                "type": "array",
                "items": {"type": "string"},
                "description": (
                    "Up to three verbatim quotes that best capture the referee's "
                    "view, positive or negative. Empty array if none stand out."
                ),
            },
            "summary": {
                "type": "string",
                "description": (
                    "Three or four sentences a recruiter could paste into a "
                    "hiring debrief: what this referee said, how strongly, and "
                    "anything that needs following up."
                ),
            },
        },
        "additionalProperties": False,
    }


# ── Call task ────────────────────────────────────────────────────────────────

def build_reference_task(
    reference: dict,
    candidate: dict,
    questions: list[dict],
) -> str:
    """Natural-language instruction for one reference call."""

    def render(q: dict, idx: int) -> str:
        text = (
            q["text"]
            .replace("{candidate_name}", candidate["name"])
            .replace("{role}", candidate["role_applied_for"])
            .replace(
                "{jd_summary}",
                candidate.get("job_description_summary") or "a range of responsibilities",
            )
        )
        line = f"{idx + 1}. {text}"
        if q.get("follow_up"):
            line += f'\n   If the answer is short or vague, probe once: "{q["follow_up"]}"'
        return line

    question_block = "\n".join(render(q, i) for i, q in enumerate(questions))
    company = candidate["company_name"]
    referee = reference["referee_name"]
    who = candidate["name"]

    return f"""Conduct a professional employment reference check by phone.

You are calling {referee}, who {who} listed as a professional reference. You are
calling on behalf of the recruiting team at {company}, which is considering {who}
for a {candidate["role_applied_for"]} role.

OPENING
- Introduce yourself: "Hello, this is Alex calling from the {company} recruiting team."
- Confirm you are speaking with {referee}.
- State why you are calling: {who} listed them as a reference and has given
  {company} permission to make contact.
- Ask whether now is a good time and that you need about ten minutes. If it is
  not, ask when to call back, thank them, and end the call.

IF THEY WILL ONLY CONFIRM DATES OF EMPLOYMENT
Many companies have a policy against giving substantive references. If that comes up:
- Accept it immediately: "I completely understand, and I appreciate your transparency."
- Ask one open question: "Is there anything at all you'd like us to know about
  {who} as a professional?"
- Whatever they answer, thank them and close. Do not push, rephrase, or try again.

QUESTIONS
Work through these conversationally — not as a checklist. Follow the thread of
what they say, and ask them in whatever order the conversation makes natural.
{question_block}

HOW TO CONDUCT THE CALL
- Probe once when an answer is short, vague, or purely positive with no example:
  "That's helpful — can you give me a specific example?"
- Pay attention to hesitation, long pauses, and qualifiers such as "I think",
  "generally", or "mostly". They are meaningful signal and belong in your notes.
- Never lead the referee toward a favourable answer and never characterise
  what other referees have said.
- If they raise a concern, let them finish and ask one neutral follow-up. Do not
  argue or defend the candidate.
- Do not discuss compensation, health, age, family status, or any other
  protected characteristic. If the referee raises one, do not pursue it.
- Keep the whole call under 15 minutes.
- Close with: "Thank you so much for your time — this is genuinely useful to us."

The reference is complete once you have either worked through the questions or
established that the referee will not answer them."""


# ── Dispatch ─────────────────────────────────────────────────────────────────

def _webhook_url() -> str | None:
    """Unguessable callback URL, or None when CALL-E could not reach it.

    CALL-E webhooks are unsigned, so the path token is the first (weak) filter
    and the receiver independently re-fetches the call from the API before
    acting on anything. See api/calle_webhook.py.

    CALL-E only delivers to public HTTPS URLs. With a local API_URL such as
    http://localhost:8000 no webhook is registered at all, and results are
    pulled instead by `sync_candidate_calls` (the check page's Refresh).
    """
    base = settings.api_url.rstrip("/")
    if not base.startswith("https://"):
        return None
    return f"{base}/api/calle/webhook/{settings.calle_webhook_token}"


def dispatch_reference_call(
    reference: dict,
    candidate: dict,
    questions: list[dict],
) -> dict[str, Any]:
    """Create one CALL-E call task. Returns {call_id, error}."""
    try:
        # Validate the destination, and apply the dial allowlist if one is set,
        # before anything reaches the network.
        phone = assert_authorized(
            reference["referee_phone"],
            [a for a in settings.calle_dial_allowlist.split(",") if a.strip()] or None,
        )
    except DestinationError as exc:
        return {"call_id": "", "error": f"DestinationError: {exc}"}

    client = get_calle()
    try:
        call = client.calls.create(
            task=build_reference_task(reference, candidate, questions),
            recipient={"phones": [phone]},
            result_schema=build_result_schema(questions),
            metadata={
                "reference_id": str(reference["id"]),
                "candidate_id": str(candidate["id"]),
            },
            # None is dropped from the request by the SDK.
            webhook_url=_webhook_url(),
            # Stable per reference: a retried dispatch must not place a 2nd call.
            idempotency_key=f"refcheck_ref_{reference['id']}",
        )
        return {"call_id": str(call.get("id") or ""), "error": None}
    except (CalleAPIError, CalleConnectionError, CalleTimeoutError) as exc:
        return {"call_id": "", "error": f"{type(exc).__name__}: {exc}"}


async def dispatch_all_calls(
    references: list[dict],
    candidate: dict,
    questions: list[dict],
) -> list[tuple[str, dict[str, Any]]]:
    """Dispatch every reference concurrently.

    Each reference gets its own call task, because the task text and the result
    schema are personalised per referee. The SDK is synchronous, so each create
    runs in a worker thread.
    """
    results = await asyncio.gather(
        *(
            asyncio.to_thread(dispatch_reference_call, ref, candidate, questions)
            for ref in references
        ),
        return_exceptions=True,
    )

    out: list[tuple[str, dict[str, Any]]] = []
    for ref, res in zip(references, results):
        if isinstance(res, BaseException):
            out.append((str(ref["id"]), {"call_id": "", "error": str(res)}))
        else:
            out.append((str(ref["id"]), res))
    return out


# ── Reading the terminal call ────────────────────────────────────────────────

def _recipient(call: dict) -> dict:
    recipients = call.get("recipients") or []
    return recipients[0] if recipients else {}


def extract_transcript(call: dict) -> str | None:
    """Flatten `recipients[].attempts[].transcript_turns` into readable text."""
    lines: list[str] = []
    for attempt in _recipient(call).get("attempts") or []:
        for turn in attempt.get("transcript_turns") or []:
            speaker = {"bot": "Agent", "user": "Referee"}.get(
                turn.get("speaker", ""), "Unknown"
            )
            text = (turn.get("text") or "").strip()
            if text:
                lines.append(f"{speaker}: {text}")
    return "\n".join(lines) or None


def extract_duration_seconds(call: dict) -> int | None:
    """Longest attempt duration, from the attempt timestamps."""
    from datetime import datetime

    best: int | None = None
    for attempt in _recipient(call).get("attempts") or []:
        started, completed = attempt.get("started_at"), attempt.get("completed_at")
        if not (started and completed):
            continue
        try:
            delta = datetime.fromisoformat(
                completed.replace("Z", "+00:00")
            ) - datetime.fromisoformat(started.replace("Z", "+00:00"))
        except ValueError:
            continue
        seconds = int(delta.total_seconds())
        if seconds >= 0 and (best is None or seconds > best):
            best = seconds
    return best


def extract_provider_call_id(call: dict) -> str | None:
    """Dashboard-visible Call Record ID (may be null)."""
    for attempt in _recipient(call).get("attempts") or []:
        if attempt.get("provider_call_id"):
            return str(attempt["provider_call_id"])
    return None


# ── Scoring ──────────────────────────────────────────────────────────────────

def compute_reference_score(
    answers: dict[str, Any] | None,
    enthusiasm: str | None,
) -> float | None:
    """Weighted 0-10 score for one reference, or None if nothing was answered.

    Questions the referee did not answer are excluded from the average rather
    than being counted as neutral — a skipped question is missing evidence, not
    a middling review.
    """
    if not answers:
        return None

    weighted_sum = 0.0
    total_weight = 0.0

    for question_id, answer in answers.items():
        if not isinstance(answer, dict):
            continue
        # CALL-E's `rating`, or `score` once normalised for storage.
        rating = str(answer.get("rating", answer.get("score", "not_answered")))
        if rating not in _NUMERIC_RATINGS:
            continue
        weight = WEIGHTS.get(question_id, DEFAULT_WEIGHT)
        weighted_sum += (int(rating) / 5.0 * 10.0) * weight
        total_weight += weight

    if total_weight == 0:
        return None

    base = weighted_sum / total_weight
    bonus = ENTHUSIASM_BONUS.get(enthusiasm or "unknown", 0.0)
    return round(min(10.0, max(0.0, base + bonus)), 2)


def normalize_answer(answer: dict[str, Any]) -> dict[str, Any]:
    """One CALL-E answer `{response, rating}` → the stored `{text, score}` shape.

    `score` is an int 1-5, or None for `not_answered` — shown as "Not
    answered", never as an invented middle score. Already-normalised input
    passes through, so readers can call this on old and new rows alike.
    """
    if "response" not in answer and "rating" not in answer:
        score = answer.get("score")
        return {
            "text": str(answer.get("text") or ""),
            "score": int(score) if str(score) in _NUMERIC_RATINGS else None,
        }
    rating = str(answer.get("rating", "not_answered"))
    return {
        "text": str(answer.get("response") or ""),
        "score": int(rating) if rating in _NUMERIC_RATINGS else None,
    }


def normalize_answers(answers: dict[str, Any] | None) -> dict[str, dict[str, Any]]:
    """Every answer in a structured result, in the shape the API and UI read."""
    return {
        question_id: normalize_answer(answer)
        for question_id, answer in (answers or {}).items()
        if isinstance(answer, dict)
    }


def compute_candidate_score(reference_scores: list[float]) -> float | None:
    scores = [s for s in reference_scores if s is not None]
    if not scores:
        return None
    return round(sum(scores) / len(scores), 2)


def score_to_recommendation(score: float) -> str:
    if score >= 8.5:
        return "strong_yes"
    if score >= 7.0:
        return "yes"
    if score >= 5.5:
        return "neutral"
    if score >= 4.0:
        return "no"
    return "strong_no"


# ── Mapping CALL-E terminal state onto our own columns ───────────────────────

# `call_status` enum in the DB: queued | calling | completed | failed | no_answer | declined
OUTCOME_TO_STATUS: dict[str, str] = {
    "completed": "completed",
    "only_confirmed_employment": "completed",
    "declined": "declined",
    "no_usable_answer": "failed",
    "wrong_person": "failed",
    "unknown": "failed",
}

_TRISTATE = {"yes": True, "no": False}


def rehire_to_bool(value: str | None) -> bool | None:
    """`qualified` and `unknown` deliberately stay NULL rather than collapse to a boolean."""
    return _TRISTATE.get(value or "")


def enthusiasm_for_db(value: str | None) -> str | None:
    """The DB enum has no `unknown` member."""
    return None if value in (None, "unknown") else value
