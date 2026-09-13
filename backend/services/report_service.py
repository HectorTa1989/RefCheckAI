"""Generate styled PDF reference reports via WeasyPrint."""
from __future__ import annotations
import io
from pathlib import Path
from datetime import datetime
from jinja2 import Environment, FileSystemLoader

BASE_DIR = Path(__file__).parent.parent
TEMPLATES_DIR = BASE_DIR / "templates"

jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=True,
)

RECOMMENDATION_LABELS = {
    "strong_yes": "Strong Yes",
    "yes": "Yes",
    "neutral": "Neutral",
    "no": "No",
    "strong_no": "Strong No",
}

RECOMMENDATION_COLORS = {
    "strong_yes": "#34C759",
    "yes": "#34C759",
    "neutral": "#FF9F0A",
    "no": "#FF3B30",
    "strong_no": "#FF3B30",
}

ENTHUSIASM_LABELS = {
    "very_enthusiastic": "Very Enthusiastic",
    "positive": "Positive",
    "neutral": "Neutral",
    "hesitant": "Hesitant",
    "negative": "Negative",
}

QUESTION_LABELS = {
    "q_relationship": "Working Relationship",
    "q_role": "Responsibilities",
    "q_strengths": "Key Strengths",
    "q_areas_for_growth": "Areas for Growth",
    "q_achievement": "Notable Achievement",
    "q_under_pressure": "Performance Under Pressure",
    "q_collaboration": "Collaboration",
    "q_rehire": "Would Rehire",
    "q_fit": "Role Fit",
    "q_technical": "Technical Ability",
    "q_problem_solving": "Problem Solving",
    "q_code_quality": "Code Quality",
    "q_learning": "Learning Agility",
    "q_quota": "Quota Attainment",
    "q_customer": "Customer Relationships",
    "q_objections": "Handling Objections",
    "q_coachability": "Coachability",
    "q_team_building": "Team Building",
    "q_decision_making": "Decision Making",
    "q_strategic": "Strategic Thinking",
    "q_conflict": "Conflict Management",
    "q_cross_functional": "Cross-Functional Work",
    "q_results": "Business Results",
    "q_pipeline": "Pipeline Management",
}


def _score_bar(score: float, max_score: float = 10.0) -> int:
    """Return percentage 0-100 for CSS width."""
    return int((score / max_score) * 100)


def generate_pdf_bytes(candidate: dict, references: list[dict]) -> bytes:
    """Render the report template to PDF bytes."""
    from weasyprint import HTML, CSS

    template = jinja_env.get_template("report.html")

    from services.calle_service import normalize_answer

    # Enrich references
    enriched_refs = []
    for ref in references:
        answers = ref.get("answers") or {}
        enriched_answers = []
        for q_id, ans in answers.items():
            if isinstance(ans, dict):
                qa = normalize_answer(ans)  # tolerates rows in CALL-E's raw shape
                enriched_answers.append({
                    "label": QUESTION_LABELS.get(q_id, q_id.replace("_", " ").title()),
                    "text": qa["text"] or "Not answered",
                    "score": qa["score"],  # None renders as an em dash
                    "score_pct": int(((qa["score"] or 0) / 5) * 100),
                })
        enriched_refs.append({
            **ref,
            "enriched_answers": enriched_answers,
            "enthusiasm_label": ENTHUSIASM_LABELS.get(
                ref.get("referee_enthusiasm", ""), ""
            ),
            "score_pct": _score_bar(ref.get("overall_reference_score") or 0),
        })

    rec = candidate.get("recommendation", "neutral")
    ctx = {
        "candidate": candidate,
        "references": enriched_refs,
        "generated_at": datetime.now().strftime("%B %d, %Y at %I:%M %p"),
        "recommendation_label": RECOMMENDATION_LABELS.get(rec, rec),
        "recommendation_color": RECOMMENDATION_COLORS.get(rec, "#6E6E73"),
        "overall_score_pct": _score_bar(candidate.get("overall_score") or 0),
    }

    html_string = template.render(**ctx)
    pdf_bytes = HTML(string=html_string, base_url=str(TEMPLATES_DIR)).write_pdf()
    return pdf_bytes
