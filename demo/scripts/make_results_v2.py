"""Score the walkthrough's three references with the backend's own code.

    backend/.venv/Scripts/python scripts/make_results_v2.py

Each reference is written as the `structured_result` CALL-E would return for the
Software Engineer template, then run through the same functions the webhook
uses: normalize_answers, compute_reference_score, rehire_to_bool,
compute_candidate_score and score_to_recommendation. Every number on screen in
the video comes from here. Output: src/v2/results.json
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

DEMO = Path(__file__).resolve().parent.parent
BACKEND = DEMO.parent / "backend"
sys.path.insert(0, str(BACKEND))
for k, v in {
    "SUPABASE_URL": "https://placeholder.supabase.co", "SUPABASE_SERVICE_ROLE_KEY": "placeholder",
    "CALLE_API_KEY": "iams_test_placeholder",
}.items():
    os.environ.setdefault(k, v)

from services.calle_service import (  # noqa: E402
    compute_candidate_score,
    compute_reference_score,
    enthusiasm_for_db,
    normalize_answers,
    rehire_to_bool,
    score_to_recommendation,
)

SCRIPT = json.loads((DEMO / "src" / "v2" / "script.json").read_text(encoding="utf-8"))


def a(response: str, rating: str) -> dict:
    return {"response": response, "rating": rating}


NOT_ANSWERED = a("", "not_answered")

RESULTS = {
    "james": {
        "spoke_with_referee": "yes",
        "call_outcome": "completed",
        "referee_enthusiasm": "very_enthusiastic",
        "would_rehire": "yes",
        "answers": {
            "q_relationship": a("Managed Maria for a little over three years on the payments platform team at Tidewater Payments.", "4"),
            "q_technical": a("One of the strongest engineers he has managed. Led the move to a new ledger system with zero downtime and wrote most of the rollback plan.", "5"),
            "q_problem_solving": a("Found the root cause of a Black Friday outage while the rest of the team was still triaging.", "4"),
            "q_code_quality": a("Called her code reviews \"a masterclass\"; the whole team improved by reading them.", "5"),
            "q_collaboration": a("Product and support trusted her to explain trade-offs in plain language.", "4"),
            "q_learning": a("Productive on the new ledger stack within a few weeks.", "4"),
            "q_under_pressure": a("Calm in incidents: \"the person you want on the bridge at 2 a.m.\"", "5"),
            "q_rehire": a("Would hire her again \"in a heartbeat\"; she is the first call he would make.", "5"),
            "q_fit": a("Expects her to do very well: owning a payments platform is the work she did for him at a senior level.", "4"),
        },
        "strengths": [
            "Led a zero-downtime ledger migration",
            "Code reviews that raised the whole team's bar",
            "Calm, fast root-causing during incidents",
        ],
        "red_flags": [],
        "notable_quotes": [
            "If I were starting a team tomorrow, she's the first call I'd make.",
            "She's the person you want on the bridge at 2 a.m.",
        ],
        "summary": "James managed Maria for three years on Tidewater's payments platform team and was emphatic in his praise. He credits her with a zero-downtime ledger migration and a code-review culture that lifted the team, and would rehire her \"in a heartbeat\". No concerns raised.",
    },
    "priya": {
        "spoke_with_referee": "yes",
        "call_outcome": "completed",
        "referee_enthusiasm": "positive",
        "would_rehire": "yes",
        "answers": {
            "q_relationship": a("Worked with Maria for two years as the product manager on the payments team.", "4"),
            "q_technical": a("A strong engineer who turned vague product asks into sound designs.", "4"),
            "q_problem_solving": a("Broke a messy reconciliation problem into small, shippable steps.", "4"),
            "q_code_quality": a("High standards, though she sometimes pushed for refactors when the timeline was tight.", "3"),
            "q_collaboration": a("Excellent: explained trade-offs so non-engineers could make the call.", "5"),
            "q_learning": a("Picked up the fraud-scoring domain quickly.", "4"),
            "q_under_pressure": a("Steady under deadline pressure, and honest about estimates.", "4"),
            "q_rehire": a("Yes, she would work with Maria again.", "4"),
            "q_fit": a("Would do well owning a payments platform, with a product manager who holds the line on scope.", "4"),
        },
        "strengths": [
            "Explains technical trade-offs to non-engineers",
            "Honest, reliable estimates",
        ],
        "red_flags": ["Can over-invest in refactors when timelines are tight"],
        "notable_quotes": ["She'll tell you the honest estimate, not the one you want to hear."],
        "summary": "Priya was Maria's product counterpart for two years and describes a strong, communicative engineer with honest estimates. Her one reservation: Maria can push for refactors when the timeline is tight, which is worth probing in the final interview.",
    },
    "daniel": {
        "spoke_with_referee": "yes",
        "call_outcome": "only_confirmed_employment",
        "referee_enthusiasm": "neutral",
        "would_rehire": "unknown",
        "answers": {
            "q_relationship": a("Confirmed Maria worked at Harbor Commerce from 2019 to 2021 as a software engineer; would not say more, citing company policy.", "3"),
            "q_technical": NOT_ANSWERED,
            "q_problem_solving": NOT_ANSWERED,
            "q_code_quality": NOT_ANSWERED,
            "q_collaboration": NOT_ANSWERED,
            "q_learning": NOT_ANSWERED,
            "q_under_pressure": NOT_ANSWERED,
            "q_rehire": a("Said she is eligible for rehire; nothing further.", "4"),
            "q_fit": NOT_ANSWERED,
        },
        "strengths": [],
        "red_flags": [],
        "notable_quotes": ["Just that she's eligible for rehire."],
        "summary": "Daniel confirmed dates and title only, citing Harbor Commerce policy, and added that Maria is eligible for rehire. No substantive assessment was given; the unanswered questions are left out of the score rather than counted as neutral.",
    },
}

REFEREES = {
    "james": {"referee_name": "James Okafor", "referee_phone": "+14155550142",
              "relationship": "Former direct manager", "company_at_time": "Tidewater Payments"},
    "priya": {"referee_name": "Priya Raman", "referee_phone": "+12065550188",
              "relationship": "Product manager, peer", "company_at_time": "Tidewater Payments"},
    "daniel": {"referee_name": "Daniel Weiss", "referee_phone": "+13125550107",
               "relationship": "Skip-level manager", "company_at_time": "Harbor Commerce"},
}


def transcript(turns: list[dict]) -> str:
    """Same format as services.calle_service.extract_transcript."""
    who = {"bot": "Agent", "user": "Referee"}
    return "\n".join(f"{who[t['who']]}: {t['text']}" for t in turns)


def call_turns(key: str) -> list[dict]:
    call = SCRIPT["calls"].get(key)
    if key == "james":
        heard = call["lines"]
        split = next(i for i, l in enumerate(heard) if l.get("skip"))
        return heard[:split] + call["skipped_turns"] + heard[split:]
    if key == "daniel":
        return call["skipped_before"] + call["lines"] + call["skipped_after"]
    return [
        {"who": "bot", "text": "Hello, this is Alex calling from the Northwind recruiting team. Am I speaking with Priya Raman?"},
        {"who": "user", "text": "Yes, hi. Is this about Maria?"},
        {"who": "bot", "text": "It is. Maria Chen listed you as a reference, and she's given Northwind permission to contact you. Is now a good time? I'll need about ten minutes."},
        {"who": "user", "text": "Sure, now works."},
        {"who": "bot", "text": "How did you and Maria work together, and for how long?"},
        {"who": "user", "text": "I was the product manager on her team for about two years."},
        {"who": "bot", "text": "How would you describe her code quality and engineering practices?"},
        {"who": "user", "text": "Really high standards. If anything, she sometimes pushed for a refactor when the timeline was tight."},
        {"who": "bot", "text": "That's helpful. Can you give me a specific example?"},
    ]


def main() -> None:
    refs = []
    for key, result in RESULTS.items():
        score = compute_reference_score(result["answers"], result["referee_enthusiasm"])
        refs.append({
            "key": key,
            **REFEREES[key],
            "call_status": "completed",
            "call_outcome": result["call_outcome"],
            "referee_enthusiasm": enthusiasm_for_db(result["referee_enthusiasm"]),
            "would_rehire": rehire_to_bool(result["would_rehire"]),
            "answers": normalize_answers(result["answers"]),
            "strengths": result["strengths"],
            "red_flags": result["red_flags"],
            "notable_quotes": result["notable_quotes"],
            "summary": result["summary"],
            "overall_reference_score": score,
            "transcript": transcript(call_turns(key)),
            "structured_result": result,
        })
        print(f"{key:7s} score {score}")
    overall = compute_candidate_score([r["overall_reference_score"] for r in refs])
    rec = score_to_recommendation(overall)
    print(f"candidate {overall} -> {rec}")
    out = {"overall_score": overall, "recommendation": rec, "references": refs}
    (DEMO / "src" / "v2" / "results.json").write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
