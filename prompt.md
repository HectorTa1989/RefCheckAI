# RefCheck AI — Automated Employment Reference Verification by Phone

> **Target Prize:** Most Practical Use Case — $4,000  
> **Hackathon:** CALL-E: Your Code Is Calling (Deadline: Sep 14, 2026)  
> **Core Hook:** HR teams spend 3–5 hours per hire on reference calls. RefCheck AI does it in 20 minutes — calling references directly, asking structured questions, and delivering a scored report back to recruiters.

---

## Pain Point

Employment reference checking is **one of the most universally hated tasks in HR**:

- Each reference check requires **3–5 phone calls** to reach a live person (references dodge emails).
- A recruiter must personally dial, identify themselves, ask 8–12 structured questions, take notes, and write a summary — **for every candidate, for every reference**.
- This takes **3–5 hours per hire** and is often skipped entirely due to time pressure.
- Reference checking services exist but cost **$40–$150 per check** and still take days.
- **Bad hires cost companies 30% of first-year salary** — and bad reference checks are a leading cause.

RefCheck AI calls each reference directly, conducts a thorough structured interview, handles objections ("we only confirm dates of employment"), and delivers a structured, scored report to the recruiter in under 20 minutes.

---

## What to Build

A web app for HR teams and recruiters that:

1. **Recruiter adds candidate + references** — name, phone, relationship, role being hired for.
2. **RefCheck AI calls each reference** via CALL-E with a tailored structured interview.
3. **AI conducts the full conversation** — intro, context-setting, 8–10 structured questions, follow-ups.
4. **Returns a scored reference report** — per-question summaries, red flags, overall recommendation.
5. **Recruiter shares the report** with the hiring manager in one click.

---

## Build Prompt

```
You are building RefCheck AI — a CALL-E-powered employment reference checking platform
that calls professional references on behalf of HR teams and delivers structured reports.

### Stack
- Backend: FastAPI (Python)
- Frontend: Next.js 14 + Tailwind CSS + shadcn/ui
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth (recruiter login)
- PDF generation: weasyprint or reportlab (for shareable reports)
- Notifications: Resend email
- Phone calls: CALL-E SDK

### Core Data Models

Table: candidates
- id, recruiter_id
- name, email, role_applied_for (text)
- company_name (text)  -- the hiring company
- job_description_summary (text)
- status (enum: pending | in_progress | complete)
- overall_score (decimal 0-10)
- recommendation (enum: strong_yes | yes | neutral | no | strong_no)

Table: references
- id, candidate_id
- referee_name, referee_phone, referee_email (optional)
- relationship (text)  -- "Former direct manager at Acme Corp"
- company_at_time (text)
- call_status (enum: queued | calling | completed | failed | no_answer | declined)
- calle_call_sid (text)
- transcript (text)
- answers (jsonb)            -- {question_id: {text_answer, score (1-5)}}
- red_flags (jsonb)          -- [str]
- strengths (jsonb)          -- [str]
- referee_enthusiasm (enum: very_enthusiastic | positive | neutral | hesitant | negative)
- overall_reference_score (decimal 0-10)
- would_rehire (bool or null)
- completed_at

Table: question_templates
- id, name (text)             -- e.g. "Software Engineer Standard", "Sales Rep Standard"
- questions (jsonb)           -- [{id, text, type, follow_up_probe}]
- is_default (bool)

### Backend Architecture

#### 1. Default Question Templates

questions = [
    {
        "id": "q_relationship",
        "text": "Can you describe your working relationship with {candidate_name} and how long you worked together?",
        "type": "open",
        "follow_up": null
    },
    {
        "id": "q_role",
        "text": "What were {candidate_name}'s main responsibilities in their role?",
        "type": "open",
        "follow_up": null
    },
    {
        "id": "q_strengths",
        "text": "What would you say are {candidate_name}'s greatest professional strengths?",
        "type": "open",
        "follow_up": "Can you give me a specific example?"
    },
    {
        "id": "q_areas_for_growth",
        "text": "What areas do you think {candidate_name} could continue to develop professionally?",
        "type": "open",
        "follow_up": null
    },
    {
        "id": "q_achievement",
        "text": "Can you tell me about a specific project or achievement of {candidate_name}'s that stands out?",
        "type": "open",
        "follow_up": null
    },
    {
        "id": "q_under_pressure",
        "text": "How did {candidate_name} perform under pressure or during challenging situations?",
        "type": "open",
        "follow_up": null
    },
    {
        "id": "q_collaboration",
        "text": "How well did {candidate_name} collaborate with others on the team?",
        "type": "open",
        "follow_up": null
    },
    {
        "id": "q_rehire",
        "text": "If you had the opportunity, would you work with or hire {candidate_name} again?",
        "type": "boolean",
        "follow_up": "Can you tell me more about that?"
    },
    {
        "id": "q_fit",
        "text": "We're considering {candidate_name} for a {role} role that involves {jd_summary}. How do you think they'd do in that context?",
        "type": "open",
        "follow_up": null
    }
]

#### 2. CALL-E SKILL Prompt Builder

def build_reference_skill(reference, candidate, questions):
    q_list = "\n".join([
        f"{i+1}. {q['text'].format(candidate_name=candidate.name, role=candidate.role_applied_for, jd_summary=candidate.job_description_summary)}"
        + (f"\n   Follow-up probe if they give a short answer: '{q['follow_up']}'" if q['follow_up'] else "")
        for i, q in enumerate(questions)
    ])

    return f"""
    You are a professional HR reference checker calling {reference.referee_name}
    on behalf of {candidate.company_name}.

    You are calling regarding their professional reference for {candidate.name},
    who has applied for the role of {candidate.role_applied_for}.

    Begin the call by:
    1. Introducing yourself: "Hello, this is Alex calling from {candidate.company_name}'s recruiting team."
    2. Confirming they are {reference.referee_name} and that they were listed as a reference by {candidate.name}.
    3. Asking if they have 10 minutes for a quick reference call.
    4. Explaining: "{candidate.name} has given us permission to speak with their references."

    If they say they can only confirm dates of employment (HR policy):
    - Acknowledge this: "I understand completely."
    - Try asking one open-ended character question: "Is there anything you can share about {candidate.name} as a professional that you'd like us to know?"
    - Do not push if they decline.

    If they agree to a full reference check, ask these questions naturally and conversationally:
    {q_list}

    Rules:
    - Ask follow-up probes when answers are vague or very short.
    - Note any hesitation, pauses before answering, or qualifications ("I think", "usually", "mostly").
    - If they say something notably positive or negative, gently probe: "That's interesting — can you tell me more about that?"
    - Keep the call under 15 minutes.
    - End with: "Thank you so much for your time. Your input is really valuable."

    Return JSON:
    {{
      "spoke_with_referee": bool,
      "call_outcome": "completed" | "only_confirmed_employment" | "declined" | "no_answer" | "wrong_number",
      "referee_enthusiasm": "very_enthusiastic" | "positive" | "neutral" | "hesitant" | "negative",
      "would_rehire": bool or null,
      "answers": {{
        "q_relationship": {{"text": str, "score": int (1-5)}},
        "q_role": {{"text": str, "score": int (1-5)}},
        "q_strengths": {{"text": str, "score": int (1-5)}},
        "q_areas_for_growth": {{"text": str, "score": int (1-5)}},
        "q_achievement": {{"text": str, "score": int (1-5)}},
        "q_under_pressure": {{"text": str, "score": int (1-5)}},
        "q_collaboration": {{"text": str, "score": int (1-5)}},
        "q_rehire": {{"text": str, "score": int (1-5)}},
        "q_fit": {{"text": str, "score": int (1-5)}}
      }},
      "strengths": [str],
      "red_flags": [str],
      "notable_quotes": [str],
      "overall_reference_score": decimal (0-10),
      "summary": str
    }}
    """

#### 3. Reference Call Dispatch

POST /api/checks/{candidate_id}/start
- Pull all references for candidate
- For each reference, trigger calle_client.calls.create() with a 5-minute stagger
  (avoid all 3 calls landing at the same minute)
- Update reference call_status = 'calling'

#### 4. CALL-E Callback Handler

POST /api/calle/callback/{reference_id}
- Parse CALL-E structured JSON
- Store transcript, answers, scores, red_flags, strengths
- Compute reference overall_score: weighted avg of q scores + enthusiasm bonus
- If all references for candidate are complete:
    → Aggregate to candidate.overall_score (avg of reference scores)
    → Determine recommendation from score
    → Send recruiter email: "RefCheck Complete for {candidate.name} — Score: 7.8/10"
    → Generate PDF report

#### 5. PDF Report Generator

def generate_report(candidate_id):
    candidate = db.get_candidate(candidate_id)
    references = db.get_references(candidate_id)

    report = {
        "candidate": candidate.name,
        "role": candidate.role_applied_for,
        "overall_score": candidate.overall_score,
        "recommendation": candidate.recommendation,
        "references": [
            {
                "referee": ref.referee_name,
                "relationship": ref.relationship,
                "enthusiasm": ref.referee_enthusiasm,
                "would_rehire": ref.would_rehire,
                "score": ref.overall_reference_score,
                "strengths": ref.strengths,
                "red_flags": ref.red_flags,
                "notable_quotes": ref.notable_quotes,
                "answers": ref.answers
            }
            for ref in references
        ]
    }
    # Render to styled PDF using weasyprint HTML template
    return generate_pdf_from_template("report_template.html", report)

### Frontend

#### Pages

/dashboard
- Active checks (in progress)
- Completed checks with scores
- Candidate cards: name, role, score ring, recommendation badge
- "New Check" CTA button

/checks/new
Step 1 — Candidate info: name, role, company, paste job description
Step 2 — Add references (min 2, max 4): name, phone, relationship
Step 3 — Select question template (Standard, Technical, Sales, Leadership)
Step 4 — Review & Launch → show estimated completion time (~20 min)

/checks/{id}
- Candidate overview card: overall score, recommendation, completion status
- Reference tabs (one per reference):
    - Call status badge
    - Enthusiasm indicator (⭐⭐⭐⭐⭐)
    - Would rehire: ✅ / ❌ / ⚪ Not answered
    - Per-question answers with scores
    - Red flags (highlighted in red)
    - Notable quotes
    - Full transcript (expandable)
- "Download PDF Report" button
- "Share with Hiring Manager" → generates shareable link

/templates
- View / edit question sets per role type
- Create custom question templates

### Demo Script (for 3-minute submission video)

1. "We've got a great candidate — but I need 3 references checked by tomorrow. That's normally
   a full day's work."
2. Open RefCheck AI → New Check → add candidate Maria Chen, Software Engineer role.
3. Add 3 references: former manager, colleague, skip-level.
4. Select "Software Engineer Standard" template. Launch.
5. Show 3 CALL-E calls fire with staggered timing.
6. Play recording of first reference call — natural conversation, 9 structured questions, follow-ups.
7. Skip forward to "All 3 references complete" notification (18 minutes later in demo).
8. Show the candidate report: Overall 8.1/10 — Strong Yes.
9. Show per-reference breakdown, red flag section (empty), notable quotes.
10. Click "Download PDF" → show the formatted report.
11. Close: "3 reference calls, 18 minutes, zero recruiter time. Next candidate."

### Why This Wins "Most Practical Use Case"

- HR is a universally felt pain across every company that hires people.
- The ROI is crystal clear: 3–5 hours of recruiter time → 20 minutes, automated.
- Multiple coordinated CALL-E calls with structured outputs make it technically sophisticated.
- The PDF report is a complete product — not a demo.
- Immediate commercial potential: recruiters would pay $10–$30 per check today.
```

---

## CALL-E Integration Specifics

| Hook | How |
|------|-----|
| Multi-reference outbound calls | Staggered `client.calls.create()` per reference |
| Structured interview | CALL-E SKILL with 9 questions + follow-up probe logic |
| HR policy handling | SKILL handles "we only confirm dates" gracefully |
| Score aggregation | Callback → per-question scores → overall candidate score |
| Report generation | WeasyPrint PDF from aggregated reference SKILL outputs |

---

## Winning Angle

**Judging Criteria Match:**

| Criterion | How RefCheck AI Scores |
|-----------|----------------------|
| Real World Impact | Every company that hires deals with this; clear dollar-hour ROI |
| Quality of Idea | Reference checking is classically phone-only — CALL-E is the perfect fit |
| Technical Implementation | Multi-call orchestration, per-question scoring, follow-up probe logic |
| Product Experience | Clean recruiter dashboard + shareable PDF report — this is a real product |

**Differentiator:** Reference checking is one of the few workflows that is *genuinely impossible to automate* without real phone calls — you can't email a reference and get honest feedback. RefCheck AI is the app that CALL-E was literally made to enable. That makes the judges go: "of course."

My github HectorTa1989. Use polar.sh for paywall, but let me use all paid features with an admin account. Show readme with project structure and Build the whole project with UI design as Apple style.