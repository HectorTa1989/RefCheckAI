# RefCheck AI 📞

> **Automated employment reference verification by phone — powered by CALL-E**  
> Hackathon submission for [CALL-E: Your Code Is Calling](https://call-e.devpost.com) · **Most Practical Use Case — $4,000**

HR teams spend 3–5 hours per hire on reference calls. RefCheck AI does it in 20 minutes — calling each reference directly, asking 9 structured questions with follow-up probes, and delivering a scored PDF report back to the recruiter.

---

## Demo

| Dashboard | New check flow | Reference report |
|-----------|---------------|-----------------|
| Live score rings per candidate | 4-step wizard | Per-question breakdown + red flags |

---

## Project structure

```
refcheck-ai/
├── README.md
├── supabase/
│   └── migrations/
│       └── 001_initial.sql          # Full DB schema + seed templates
│
├── backend/                         # FastAPI (Python)
│   ├── main.py                      # App entrypoint + router registration
│   ├── requirements.txt
│   ├── .env.example
│   ├── db/
│   │   └── client.py                # Supabase service-role client + settings
│   ├── models/
│   │   └── schemas.py               # Pydantic v2 request/response models
│   ├── api/
│   │   ├── candidates.py            # CRUD + /start endpoint
│   │   ├── references.py            # Reference CRUD
│   │   ├── templates.py             # Question template CRUD
│   │   ├── calle_webhook.py         # CALL-E callback → score → email → PDF
│   │   └── reports.py               # PDF download endpoint
│   ├── services/
│   │   ├── calle_service.py         # Skill prompt builder + call dispatch
│   │   ├── report_service.py        # WeasyPrint PDF generation
│   │   └── email_service.py         # Resend completion notification
│   └── templates/
│       └── report.html              # Styled PDF template (Jinja2)
│
└── frontend/                        # Next.js 15 App Router
    ├── app/
    │   ├── layout.tsx               # Root layout + Toaster
    │   ├── page.tsx                 # Redirect → /dashboard
    │   ├── (auth)/login/page.tsx    # Magic-link sign-in
    │   ├── (app)/
    │   │   ├── layout.tsx           # App shell with Sidebar
    │   │   ├── dashboard/page.tsx   # Candidate list + stats
    │   │   ├── checks/new/page.tsx  # 4-step new check wizard
    │   │   ├── checks/[id]/page.tsx # Check detail + reference panels
    │   │   └── templates/page.tsx   # Question template manager
    │   └── api/polar/webhook/
    │       └── route.ts             # Polar.sh subscription sync
    ├── components/
    │   ├── Sidebar.tsx              # macOS-style sidebar nav
    │   ├── ScoreRing.tsx            # ★ SVG circular score indicator
    │   ├── CandidateCard.tsx        # Dashboard list item
    │   ├── ReferencePanel.tsx       # Expandable reference accordion
    │   └── RecommendationBadge.tsx  # Strong Yes / Yes / Neutral / No badge
    ├── lib/
    │   ├── api.ts                   # Typed API client
    │   ├── polar.ts                 # Access control + admin bypass
    │   ├── supabase.ts              # Browser Supabase client
    │   └── types.ts                 # Shared TypeScript types
    ├── middleware.ts                 # Route protection
    └── tailwind.config.ts           # Apple design tokens
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Phone calls | CALL-E (`calle-ai` Python SDK) |
| Backend API | FastAPI + Python 3.12 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (magic link) |
| Frontend | Next.js 15 + Tailwind CSS |
| PDF reports | WeasyPrint + Jinja2 |
| Email | Resend |
| Payments | Polar.sh |
| Design system | Apple HIG-inspired |

---

## Quickstart

### 1. Clone

```bash
git clone <your-repository-url>
cd refcheck-ai
```

### 2. Supabase setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and run:

```sql
-- In Supabase SQL editor
\i supabase/migrations/001_initial.sql
```

3. After running, **grant yourself admin access**:

```sql
UPDATE public.profiles SET is_admin = true, plan = 'team'
WHERE email = 'your-email@example.com';
```

### 3. Backend

```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CALLE_API_KEY, RESEND_API_KEY

python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`

### 4. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, etc.

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment variables

### Backend `.env`

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (never expose to client) |
| `CALLE_API_KEY` | CALL-E API key from dashboard |
| `CALLE_BASE_URL` | CALL-E base URL (default: `https://api.heycall-e.com`) |
| `CALLE_WEBHOOK_TOKEN` | Random string forming the webhook path. CALL-E does not sign webhooks, so this must be unguessable. |
| `RESEND_API_KEY` | Resend API key for email notifications |
| `RESEND_FROM_EMAIL` | Sender email (must be verified in Resend) |
| `APP_URL` | Frontend URL (e.g. `https://refcheck.yourdomain.com`) |
| `API_URL` | Backend URL (e.g. `https://api.refcheck.yourdomain.com`) |
| `ADMIN_EMAIL` | Admin email — bypasses all Polar.sh checks |

### Frontend `.env.local`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Backend URL |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Admin email — gets full Team access for free |
| `NEXT_PUBLIC_POLAR_ORG` | Your Polar.sh org slug |
| `POLAR_ACCESS_TOKEN` | Polar.sh API token (server-side only) |
| `POLAR_WEBHOOK_SECRET` | Polar.sh webhook secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (for webhook route only) |

---

## Admin bypass

Set `NEXT_PUBLIC_ADMIN_EMAIL` to your email in both `.env.local` and backend `.env`.  
That account will:

- Skip all Polar.sh subscription checks
- Be treated as **Team plan** (unlimited checks, custom templates, PDF share, bulk export)
- See a small **"Admin"** badge in the sidebar

No Polar subscription required for the admin account.

---

## Polar.sh setup

1. Create a [Polar.sh](https://polar.sh) account
2. Create two products:
   - **RefCheck Pro** (slug: `refcheck-pro`) — $29/mo
   - **RefCheck Team** (slug: `refcheck-team`) — $99/mo
3. Add a webhook pointing to `https://yourdomain.com/api/polar/webhook`
4. Set `POLAR_WEBHOOK_SECRET` to the webhook secret Polar generates
5. Copy your org slug to `NEXT_PUBLIC_POLAR_ORG`

---

## CALL-E integration

### How it works

1. Recruiter clicks **Launch** — the backend creates one `client.calls.create()` task per reference, all in parallel (each is its own phone line), with the question template compiled into a `result_schema`
2. CALL-E calls the reference, runs the structured interview with follow-up probe logic
3. The AI handles HR objections ("we only confirm dates") gracefully
4. CALL-E validates the call against the schema and posts a terminal event to `/api/calle/webhook/{CALLE_WEBHOOK_TOKEN}`; the backend re-fetches `GET /v1/calls/{call_id}` and stores that snapshot, never the posted body
5. Backend scores each answer (1–5), computes weighted overall score, and aggregates
6. When all calls complete → email sent, PDF available, candidate marked complete

**No public URL? Results still arrive.** CALL-E only delivers webhooks to public HTTPS
URLs, so when `API_URL` is `http://localhost:8000` no webhook is registered. The check
page's **Refresh** button (and its 15-second poll) calls `POST /api/candidates/{id}/sync`,
which pulls finished calls from the CALL-E API and scores them exactly as the webhook would.
In production the same endpoint quietly heals any missed delivery.

### Skill prompt features

- Personalized intro with company name + candidate context
- 9 structured questions (role-specific based on template)
- Follow-up probes when answers are vague
- Hesitation/qualifier detection instructions
- Graceful HR policy handling ("only confirm dates")
- Structured JSON output with per-question scores, red flags, strengths, notable quotes

### Score computation

```python
WEIGHTS = {
    "q_rehire":       2.0,   # Most predictive
    "q_strengths":    1.5,
    "q_achievement":  1.5,
    "q_fit":          1.5,
    "q_under_pressure": 1.2,
    ...
}
ENTHUSIASM_BONUS = {
    "very_enthusiastic": +0.5,
    "positive":          +0.25,
    "neutral":            0.0,
    "hesitant":          -0.25,
    "negative":          -0.75,
}
```

Candidate recommendation thresholds: `≥8.5 Strong Yes → ≥7.0 Yes → ≥5.5 Neutral → ≥4.0 No → Strong No`

---

## Design system

The UI follows Apple's Human Interface Guidelines:

| Token | Value |
|-------|-------|
| Primary blue | `#0071E3` |
| Text | `#1D1D1F` |
| Secondary text | `#6E6E73` |
| Background | `#F5F5F7` |
| Surface | `#FFFFFF` |
| Green (pass) | `#34C759` |
| Red (fail) | `#FF3B30` |
| Orange (neutral) | `#FF9F0A` |
| Border radius | 12px standard, 18px cards |
| Font | `-apple-system, BlinkMacSystemFont, SF Pro` |

**Signature component:** `ScoreRing.tsx` — SVG circular progress indicators (inspired by Apple Watch Activity rings) that animate on load, colored green/orange/red based on score threshold.

---

## Deployment

### Backend (Railway / Fly.io / Render)

```bash
# Fly.io example
cd backend
fly launch --name refcheck-api
fly secrets set SUPABASE_URL=... CALLE_API_KEY=... RESEND_API_KEY=...
fly deploy
```

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
# Set env vars in Vercel dashboard
```

### CALL-E webhook

Nothing to configure in the CALL-E dashboard: every call is created with a per-request
`webhook_url` of

```
https://your-api-domain.com/api/calle/webhook/{CALLE_WEBHOOK_TOKEN}
```

as long as `API_URL` is an `https://` URL. The reference is identified from the call's own
`metadata.reference_id` after the backend re-fetches it, not from the URL.

### Do I need Vercel + Neon?

No — a live deployment is optional for the hackathon, and the database is Supabase, not
Neon. Supabase supplies Postgres **and** the magic-link auth, and the backend talks to it
through `supabase-py`; Neon would replace only Postgres, leaving auth and the data layer to
rewrite. If you want a public demo URL: frontend on Vercel, a free Supabase project for
data + auth, and the FastAPI backend on Render / Fly.io / Railway (it needs a public HTTPS
URL for CALL-E's webhooks; without one, results arrive through `/sync` instead).

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/candidates` | List all candidates for recruiter |
| `POST` | `/api/candidates` | Create candidate |
| `GET` | `/api/candidates/{id}` | Get candidate + references |
| `PATCH` | `/api/candidates/{id}` | Update candidate |
| `DELETE` | `/api/candidates/{id}` | Delete candidate |
| `POST` | `/api/candidates/{id}/start` | Launch CALL-E reference calls |
| `POST` | `/api/candidates/{id}/sync` | Pull finished calls from CALL-E (Refresh / poll) |
| `POST` | `/api/candidates/{id}/share` | Toggle public share link |
| `POST` | `/api/references/{candidate_id}` | Add reference to candidate |
| `PATCH` | `/api/references/{id}` | Update reference |
| `DELETE` | `/api/references/{id}` | Delete reference |
| `GET` | `/api/templates` | List question templates |
| `POST` | `/api/templates` | Create custom template |
| `DELETE` | `/api/templates/{id}` | Delete custom template |
| `POST` | `/api/calle/webhook/{token}` | CALL-E terminal-event webhook (unsigned; re-fetches the call) |
| `GET` | `/api/reports/{candidate_id}/pdf` | Download PDF report |
| `GET` | `/api/shared/{share_token}` | Public read-only report (no referee contact details) |
| `GET` | `/api/shared/{share_token}/pdf` | Public PDF for a shared report |
| `GET` | `/health` | Health check |

All endpoints require `X-User-Id` header (Supabase user UUID).

---

## License

MIT — © 2026 [HectorTa1989](https://github.com/HectorTa1989)
