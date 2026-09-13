# RefCheck AI vs VouchCall — differentiation brief

**Written 2026-09-04. Submissions close 2026-09-14.**

`apps/python/vouchcall` is already merged into
[CALLE-AI/awesome-phone-call-agents](https://github.com/CALLE-AI/awesome-phone-call-agents):
*"VouchCall — AI-Powered Reference Checker."* Same problem, same prize track, and
it got there first. This is what actually separates the two, based on reading its
source rather than its README.

---

## The one difference that matters most

**VouchCall never sends a `result_schema`.** Its entire CALL-E surface is:

```python
# apps/python/vouchcall/calle_wrapper.py
return _get_client().calls.create_and_wait(
    task=goal,
    recipient={"phone": phone, "region": region, "locale": locale},
    timeout_seconds=timeout_seconds,
    idempotency_key=idempotency_key,
)
```

No `result_schema`. No `recipient_result_schema`. No `webhook_url`. It gets a raw
transcript back and then pays **Gemini 3.5 Flash** to read it and produce scores.

Everything downstream of that choice is damage control, and VouchCall's own README
lists it as safety features: score clamping to 1–10, fuzzy quote matching at a 0.65
threshold, "score-recommendation contradictions are auto-corrected", evidence
grounding where "ungrounded scores are zeroed", a Gemini retry for unparseable JSON,
and 98 tests titled *LLM output validation*.

RefCheck AI does not need any of that, because the question template compiles into a
CALL-E `result_schema` and CALL-E validates the result server-side before returning
it. An invalid result comes back as `null` rather than as plausible-looking numbers
you then have to police.

This maps directly onto the judging criterion that says *"How thoroughly and
skilfully does the project use CALL-E?"* One project uses CALL-E's structured-result
contract; the other bypasses it and buys the same capability from a second vendor.
**That is your headline, and you are currently not making it anywhere.**

## Where else you are ahead

| | RefCheck AI | VouchCall |
| --- | --- | --- |
| Structured extraction | CALL-E `result_schema`, validated server-side | Gemini over a raw transcript |
| Second LLM dependency | none | Gemini API key required, daily free-tier limits |
| Schema shape | compiled from the chosen template — a sales template yields sales fields | n/a |
| Result delivery | terminal webhooks: unsigned-delivery handling, event-id check, SQLite dedupe, independent `GET /v1/calls/{id}` re-verify | `create_and_wait` blocking poll |
| Unanswered question | `not_answered` rating, excluded from the score as missing evidence | discounted by `questions_answered / expected_questions` |
| Product surface | multi-tenant web app: auth, wizard, PDF report, shareable read-only link, billing | CLI + local Streamlit dashboard |
| Demo | 2:30 narrated 1080p walkthrough | — |

The webhook difference is worth saying out loud in the video: `create_and_wait`
holds a process open for the length of a phone call. Three references is half an
hour of blocked runtime that dies on any restart.

## Where VouchCall is genuinely ahead — close these

Be honest with yourself about this list. A judge comparing side by side will see it.

1. **Phone numbers encrypted at rest.** VouchCall uses Fernet, validates the key at
   startup, and separates `get_references()` (masked) from
   `get_references_for_calling()` (decrypted). RefCheck AI stores `referee_phone` in
   plaintext in Supabase. *This is the most visible gap.*
2. **Recorded candidate consent.** VouchCall refuses `--live` without
   `store.record_candidate_consent()`. RefCheck AI asserts consent in the call script
   and in the PDF footer but never records it. Your own share page says "candidate
   consent on file" — right now that sentence is not backed by a column.
3. **Call-to-request binding.** Before analysis, VouchCall verifies that
   `recipients[].phones[0]` matches the number it dialled and fails closed otherwise.
   RefCheck AI trusts `metadata.reference_id`. Your webhook re-fetch is stronger than
   theirs on origin, but weaker on *"is this the call I think it is."*
4. **Test depth.** 206 vs your 61 (backend) + 63 (contribution).
5. **Ambiguous-call reconciliation.** Before redialling, VouchCall checks whether the
   previous ambiguous call actually completed. Your idempotency key prevents a
   duplicate dial, which covers most of this — but not the "did it already succeed?"
   read.

Items 1 and 2 are each about an hour of work and both are things you already claim
implicitly. I would do them before anything else.

## What to change in the submission

**Devpost copy.** Your current README opens with "HR teams spend 3–5 hours per hire."
That is the *problem*, and VouchCall makes the same claim. Lead instead with the
mechanism, because that is what is actually unique:

> The question template *is* the extraction contract. Pick "Engineering" and the
> call comes back with a schema-validated JSON object carrying exactly those
> question ids — because the template compiles into a CALL-E `result_schema` and
> CALL-E validates it before it ever reaches our database. No transcript-scraping
> LLM, nothing to second-guess.

**Demo video.** The CALL-E scene already shows `result_schema=REFERENCE_SCHEMA`
highlighted and a `SCHEMA VALIDATED` badge. Nothing in the narration says why that
matters. Consider a re-record of scene 7's last line to something like: *"Every call
comes back as JSON that CALL-E has already validated against the schema — there's no
second model reading the transcript and guessing."* That is a ~5 second change to
`demo/scripts/vo.py` and a re-render.

**Prize track.** Keep Most Practical as the primary. But two near-identical reference
checkers may split that vote, and the schema-as-interview-contract idea is a real
Most Innovative angle. If Devpost lets you signal a secondary track, take it.

## The thing that decides this

VouchCall's code contains reconciliation logic for ambiguous calls and a five-tier
quality assessment. You do not write that unless real calls have gone wrong on you.
RefCheck AI has **still never placed a call.**

You have 20 free credits and ten days. One real call, screen-recorded, with the
resulting `structured_result` on screen, is worth more than any further engineering:

```bash
cd backend
python scripts/place_test_call.py --live --i-have-consent \
    --to "<a phone you own>" --referee "<your name>"
```

Everything else in this brief is a tiebreak. That is the thing that isn't.
