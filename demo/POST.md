# RefCheck AI — Devpost submission post

Copy each section into the matching Devpost field. Anything in **[brackets]** must be
filled in or removed before you submit — several claims are only true once you have
placed a real call.

---

## Tagline

*(one line, shown under the project name)*

> The question template *is* the extraction contract — reference checks that come back
> as schema-validated JSON, with no second LLM reading the transcript.

---

## Inspiration

Reference checking is the last part of hiring that still happens entirely on the phone.
A recruiter spends three to five hours per candidate chasing former managers who don't
pick up, and the industry's answer has been to skip the step or rubber-stamp it. It is
phone-shaped work that nobody wants to do, which is exactly what an outbound voice agent
should be for.

The interesting problem wasn't placing the call. It was trusting what came back.

## What it does

A recruiter enters a candidate, adds two to four referees with their relationship to the
candidate, and picks a role-specific question set. RefCheck AI then places one CALL-E
call per referee. The agent introduces itself, confirms consent, and works through the
questions conversationally — probing once when an answer is vague, and noting hesitation,
because hesitation is signal.

Each call returns a schema-validated result: a rating and a summary per question,
strengths, red flags, verbatim quotes, and an overall recommendation. The recruiter gets
a weighted score out of ten, a PDF for the hiring panel, and a read-only share link that
omits the referees' contact details.

## How I built it

**The one design decision that matters:** the question template compiles into a CALL-E
`result_schema`. Pick "Engineering" and the schema carries exactly those question ids;
pick "Sales" and it carries different ones. CALL-E performs the extraction and validates
it server-side before the result ever reaches the database.

That means there is **no second LLM** in the pipeline. Nothing to prompt, pay for, retry,
or defend against. Compare that to the alternative — take the raw transcript, send it to
another model, then write your own score clamping, quote verification, coherence checks
and grounding validation to police what it returns. All of that machinery exists to solve
a problem CALL-E already solves natively.

A few other decisions I'd defend in review:

- **An unanswered question is missing evidence, not a middling review.** The schema has an
  explicit `not_answered` rating, and unanswered questions are excluded from the weighted
  average rather than silently scored as neutral.
- **Webhooks, not blocking polls.** `create_and_wait` would hold a process open for the
  length of a phone call; three references is half an hour of blocked runtime that dies
  on any restart. Results arrive as terminal webhooks instead — and the check page's
  refresh can also pull finished calls from the API, which heals a missed delivery and is
  how results arrive when the backend has no public HTTPS URL (CALL-E only posts to one).
- **The webhook receiver assumes it is being lied to.** CALL-E webhooks are unsigned, so
  the endpoint serves on an unguessable path, requires `CALL-E-Event-Id` to match the
  body, and then re-fetches `GET /v1/calls/{call_id}` with the API key and stores *that*.
  The posted body is only a notification that something changed. Delivery is at-least-once,
  so event ids are claimed before any side effect.
- **No guessing at outcomes.** The Calls API doesn't publish no-answer or decline codes, so
  those are only ever set from the structured result — never inferred from `failure_code`.
- **Dial safety.** Destinations must be ASCII E.164; non-ASCII confusables are refused
  rather than transliterated, because a look-alike digit is a different destination. Phone
  numbers are masked in every log and preview. The bearer token is pinned to the official
  HTTPS origin, parsed rather than string-matched.

**Stack:** CALL-E (`calle-ai` Python SDK) · FastAPI · Supabase (Postgres + auth) ·
Next.js 15 · WeasyPrint · Remotion for the demo video.

## Challenges I ran into

The first version was written against an API that did not exist — a plausible-looking
`api.call-e.dev` with a `skill` parameter and a hand-rolled webhook shape. Everything
compiled and nothing could ever have worked. Rewriting it against the real contract is
where most of the interesting design came from, because the real API is *better* than the
one I imagined: `result_schema` removed an entire model from the architecture.

The second challenge was the schema itself. CALL-E's own examples are flat and tiny —
one to four scalar fields. A nine-question reference check is a nested object roughly
thirty nodes deep. **[If the schema needed shrinking after your live call, describe what
you changed here — this is a good, honest engineering story. If it worked first time,
say that instead.]**

## Accomplishments I'm proud of

- The extraction contract is derived from data, so adding a role template automatically
  produces a matching schema. No parallel code path to keep in sync.
- 109 tests in the contributed app and 101 in the product, all offline and credential-free,
  covering the schema staying inside CALL-E's supported JSON Schema subset for every
  template, the scoring weights, and the webhook trust boundary.
- The reusable core is merged into CALL-E's community repository as
  [`apps/python/refcheck-ai`](https://github.com/CALLE-AI/awesome-phone-call-agents/tree/main/apps/python/refcheck-ai)
  (PR [#309](https://github.com/CALLE-AI/awesome-phone-call-agents/pull/309)), so the
  webhook and schema patterns are available to anyone building on CALL-E.

## What I learned

Unsigned webhooks change the shape of a receiver completely. Once you accept that the
payload proves nothing, the design falls out on its own: treat the delivery as a hint,
re-fetch the authoritative state, and make duplicates free. That pattern generalises well
past this project.

I also learned to read the provider's error contract before writing business logic. It
would have been natural to map a failed call to "no answer" — but the docs say the Calls
API doesn't guarantee that distinction, and inventing it would have put fabricated
outcomes into a hiring decision.

## What's next

- Encrypting referee phone numbers at rest, and recording candidate consent as a first-class
  row rather than an assertion in the call script.
- ATS integration so checks start from an existing pipeline instead of manual entry.
- Multi-language calls for international references.

---

## Built with

`call-e` `python` `fastapi` `supabase` `postgresql` `nextjs` `typescript` `react`
`tailwindcss` `weasyprint` `remotion`

## Links

| Field | Value |
| --- | --- |
| Pull request | https://github.com/CALLE-AI/awesome-phone-call-agents/pull/309 |
| Demo video | **[YouTube/Vimeo URL — must be public]** |
| CALL-E account email | **[the email on your CALL-E account]** |
| Live demo (optional) | **[deployed URL, or omit]** |

---

## Before you submit — checklist

- [ ] Place one real call and confirm the schema is accepted. Until then, the "no second
      LLM" claim is untested and the demo video's `structured_result` is illustrative.
- [ ] Upload `demo/refcheck-ai-demo-v2.mp4` to YouTube or Vimeo and set it **public**
      (not unlisted-only).
- [ ] Decide how to describe the calls in the video. They are re-created with synthetic
      voices (Kokoro-82M) following the app's real call script — CALL-E's API returns
      transcripts, not recordings. A one-line note in "What it does" is the safe choice.
- [ ] Fill in every **[bracketed]** field above.
- [ ] Submit the CALL-E feedback survey — five separate $200 prizes, far less competition.
