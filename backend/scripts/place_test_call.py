#!/usr/bin/env python
"""Place one real RefCheck AI reference call through CALL-E.

Dry run (default) - builds and prints the exact request, sends nothing:

    python scripts/place_test_call.py

Live call - dials a real phone and spends CALL-E credits:

    python scripts/place_test_call.py --live \
        --to "+14155550142" \
        --referee "James Okafor" \
        --candidate "Maria Chen" \
        --role "Senior Software Engineer" \
        --company "Northwind" \
        --i-have-consent

`--i-have-consent` is required for a live call and asserts that the referee has
agreed to be called and the candidate has authorised the reference check. Only
call numbers you own or are authorised to call.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from db.client import get_settings  # noqa: E402
from services.phone import (  # noqa: E402
    DestinationError,
    assert_authorized,
    mask,
    mask_all,
    normalize_e164,
)
from services.calle_service import (  # noqa: E402
    build_reference_task,
    build_result_schema,
    compute_reference_score,
    extract_duration_seconds,
    extract_transcript,
    get_calle,
)

DEFAULT_QUESTIONS = [
    {
        "id": "q_relationship",
        "text": "Can you describe your working relationship with {candidate_name} and how long you worked together?",
        "type": "open",
    },
    {
        "id": "q_strengths",
        "text": "What would you say are {candidate_name}'s greatest professional strengths?",
        "type": "open",
        "follow_up": "Can you give me a specific example?",
    },
    {
        "id": "q_areas_for_growth",
        "text": "What areas could {candidate_name} continue to develop professionally?",
        "type": "open",
    },
    {
        "id": "q_rehire",
        "text": "If you had the opportunity, would you work with or hire {candidate_name} again?",
        "type": "boolean",
        "follow_up": "Can you tell me more about that?",
    },
    {
        "id": "q_fit",
        "text": "We are considering {candidate_name} for a {role} role involving {jd_summary}. How do you think they would perform?",
        "type": "open",
    },
]

RULE = "-" * 72


def build(args) -> tuple[dict, dict, str, dict]:
    reference = {
        "id": "cli-test-reference",
        "referee_name": args.referee,
        "referee_phone": args.to,
        "relationship": args.relationship,
    }
    candidate = {
        "id": "cli-test-candidate",
        "name": args.candidate,
        "role_applied_for": args.role,
        "company_name": args.company,
        "job_description_summary": args.jd,
    }
    task = build_reference_task(reference, candidate, DEFAULT_QUESTIONS)
    schema = build_result_schema(DEFAULT_QUESTIONS)
    return reference, candidate, task, schema


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--live", action="store_true", help="actually place the call")
    p.add_argument("--i-have-consent", action="store_true", dest="consent")
    p.add_argument("--to", default="+15555550100", help="referee phone, E.164")
    p.add_argument("--referee", default="Jordan Referee")
    p.add_argument("--relationship", default="Former direct manager")
    p.add_argument("--candidate", default="Maria Chen")
    p.add_argument("--role", default="Senior Software Engineer")
    p.add_argument("--company", default="Northwind")
    p.add_argument("--jd", default="owning the payments platform and reviewing others' code")
    p.add_argument("--timeout", type=float, default=1200.0, help="seconds to wait for the result")
    args = p.parse_args()

    settings = get_settings()

    # Validate the destination before anything else, so a malformed or
    # non-ASCII number never reaches the request builder.
    try:
        args.to = normalize_e164(args.to)
    except DestinationError as exc:
        print(f"Invalid destination: {exc}", file=sys.stderr)
        return 2

    allowed = [a for a in settings.calle_dial_allowlist.split(",") if a.strip()]
    reference, candidate, task, schema = build(args)

    print(RULE)
    print("CALL-E request")
    print(RULE)
    print(f"base_url        {settings.calle_base_url}")
    print(f"api_key         {'set (' + settings.calle_api_key[:9] + '...)' if settings.calle_api_key else 'MISSING'}")
    print("webhook_url     none - this script polls with calls.wait_for_result")
    print(f"recipient       {mask(args.to)}")
    print(f"idempotency_key refcheck_cli_{mask(args.to)}")
    print()
    print(RULE)
    print("task")
    print(RULE)
    print(mask_all(task))
    print()
    print(RULE)
    print("result_schema")
    print(RULE)
    print(json.dumps(schema, indent=2))
    print()

    if not args.live:
        print(RULE)
        print("DRY RUN - nothing was sent. Re-run with --live --i-have-consent to dial.")
        print(RULE)
        return 0

    if not args.consent:
        print("Refusing to place a live call without --i-have-consent.", file=sys.stderr)
        print(
            "This dials a real phone. Confirm the referee agreed to be called and\n"
            "the candidate authorised the reference check.",
            file=sys.stderr,
        )
        return 2

    if not settings.calle_api_key or settings.calle_api_key.startswith("iams_test_placeholder"):
        print("CALLE_API_KEY is not set in backend/.env.", file=sys.stderr)
        print("Get one at https://dashboard.heycall-e.com/account/api-keys", file=sys.stderr)
        return 2

    # This script is an operator tool, so unlike the web app it fails closed:
    # the number must be named explicitly in CALLE_DIAL_ALLOWLIST.
    if not allowed:
        print(
            "Refusing to dial: CALLE_DIAL_ALLOWLIST is empty.",
            file=sys.stderr,
        )
        print(
            "Add the number to backend/.env to authorize it:",
            file=sys.stderr,
        )
        print(f"  CALLE_DIAL_ALLOWLIST={args.to}", file=sys.stderr)
        return 2
    try:
        assert_authorized(args.to, allowed)
    except DestinationError as exc:
        print(f"Refusing to dial: {exc}", file=sys.stderr)
        return 2

    print(f"Placing a REAL call to {mask(args.to)} ...")
    client = get_calle()
    call = client.calls.create(
        task=task,
        recipient={"phones": [args.to]},
        result_schema=schema,
        metadata={"reference_id": reference["id"], "source": "place_test_call.py"},
        idempotency_key=f"refcheck_cli_{args.to}",
    )
    call_id = str(call["id"])
    print(f"created  call_id={call_id}  status={call.get('status')}")
    print(f"waiting up to {args.timeout:.0f}s for a terminal result ...")

    final = client.calls.wait_for_result(call_id, interval_seconds=5.0, timeout_seconds=args.timeout)

    print()
    print(RULE)
    print(f"terminal status: {final.get('status')}")
    print(RULE)
    result = final.get("structured_result")
    print("structured_result:")
    print(json.dumps(result, indent=2) if result else "  null - no schema-valid result from the evidence")
    print()
    print(f"task_completed        {final.get('task_completed')}")
    print(f"completion_confidence {final.get('completion_confidence')}")
    print(f"duration_seconds      {extract_duration_seconds(final)}")
    if result:
        score = compute_reference_score(result.get("answers"), result.get("referee_enthusiasm"))
        print(f"reference score       {score} / 10")
    transcript = extract_transcript(final)
    if transcript:
        print()
        print(RULE)
        print("transcript")
        print(RULE)
        print(mask_all(transcript))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
