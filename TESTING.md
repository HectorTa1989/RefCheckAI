# Testing Guide

This guide covers how to test RefCheck AI at different levels: unit tests, integration tests with CALL-E, and manual web application testing.

---

## Table of Contents

- [Unit Tests](#unit-tests)
- [CALL-E Integration Test](#calle-integration-test)
- [Manual Web Application Testing](#manual-web-application-testing)
- [Test Environment Setup](#test-environment-setup)

---

## Unit Tests

### Running Unit Tests

Unit tests use pytest and require no external services (no Supabase, no CALL-E credentials, no real phone calls).

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
pytest
```

### Test Coverage

The test suite covers:

- **CALL-E service** (`test_calle_service.py`): Task building, result schema compilation, score computation
- **CALL-E webhook handler** (`test_calle_webhook.py`): Webhook parsing, call re-fetching, idempotency
- **CALL-E sync endpoint** (`test_calle_sync.py`): Pulling finished calls from CALL-E API
- **Phone security** (`test_phone_security.py`): E.164 normalization, allowlist validation, masking

All tests use fixtures from `conftest.py` with mock data and no external dependencies.

### Running Specific Tests

```bash
# Run a specific test file
pytest tests/test_calle_service.py

# Run a specific test function
pytest tests/test_calle_service.py::test_build_reference_task

# Run with verbose output
pytest -v

# Run with coverage
pip install pytest-cov
pytest --cov=services --cov=api --cov-report=html
```

---

## CALL-E Integration Test

The `place_test_call.py` script allows you to place a single real reference call through CALL-E for integration testing.

### Dry Run (No Call Made)

Test the request building without spending credits:

```bash
cd backend
python scripts/place_test_call.py
```

This prints:
- The CALL-E request configuration
- The task prompt (with phone numbers masked)
- The result schema JSON
- A confirmation that nothing was sent

### Live Call (Requires Consent)

Place a real call to a phone number you own:

```bash
cd backend
python scripts/place_test_call.py --live \
    --to "+14155550142" \
    --referee "James Okafor" \
    --candidate "Maria Chen" \
    --role "Senior Software Engineer" \
    --company "Northwind" \
    --i-have-consent
```

**Required flags:**
- `--live`: Actually place the call
- `--i-have-consent`: Asserts the referee agreed to be called and the candidate authorized the reference check

**Optional flags:**
- `--to`: Referee phone number (E.164 format, default: `+15555550100`)
- `--referee`: Referee name (default: `Jordan Referee`)
- `--relationship`: Relationship to candidate (default: `Former direct manager`)
- `--candidate`: Candidate name (default: `Maria Chen`)
- `--role`: Role applied for (default: `Senior Software Engineer`)
- `--company`: Hiring company (default: `Northwind`)
- `--jd`: Job description summary (default: `owning the payments platform...`)
- `--timeout`: Seconds to wait for result (default: `1200`)

### Security Requirements

For live calls, the script enforces:

1. **CALLE_API_KEY must be set** in `backend/.env` (not the placeholder)
2. **CALLE_DIAL_ALLOWLIST must contain the number** in `backend/.env`:

   ```env
   CALLE_DIAL_ALLOWLIST=+14155550142,+15555550100
   ```

   This prevents accidental calls to unauthorized numbers.

3. **Phone number must be valid E.164** format (e.g., `+14155550142`)

### Expected Output

A successful live call prints:

```
Placing a REAL call to +1***-***-0142 ...
created  call_id=call_abc123  status=queued
waiting up to 1200s for a terminal result ...

----------------------------------------------------------------------
terminal status: completed
----------------------------------------------------------------------
structured_result:
{
  "spoke_with_referee": "yes",
  "call_outcome": "completed",
  "referee_enthusiasm": "very_enthusiastic",
  "would_rehire": "yes",
  "answers": {
    "q_relationship": {"response": "Managed her for three years.", "rating": "4"},
    ...
  },
  "strengths": ["Owned the payments migration end-to-end"],
  "red_flags": [],
  "notable_quotes": ["She's the first call I make."],
  "summary": "Extremely strong reference."
}

task_completed        True
completion_confidence {'score': 0.9, 'label': 'high'}
duration_seconds      480
reference score       8.5 / 10

----------------------------------------------------------------------
transcript
----------------------------------------------------------------------
[masked transcript with turns]
```

---

## Manual Web Application Testing

### Prerequisites

1. **Supabase project** with migrations applied:
   ```sql
   -- In Supabase SQL Editor
   \i supabase/migrations/001_initial.sql
   \i supabase/migrations/002_calle_integration.sql
   ```

2. **Grant yourself admin access**:
   ```sql
   UPDATE public.profiles 
   SET is_admin = true, plan = 'team'
   WHERE email = 'your-email@example.com';
   ```

3. **Backend running**:
   ```bash
   cd backend
   cp .env.example .env
   # Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CALLE_API_KEY, RESEND_API_KEY
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

4. **Frontend running**:
   ```bash
   cd frontend
   cp .env.local.example .env.local
   # Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, etc.
   npm install
   npm run dev
   ```

### Test Scenarios

#### 1. Authentication Flow

- Navigate to `http://localhost:3000`
- Click "Sign in with magic link"
- Enter your email
- Check email for magic link (Supabase sends email)
- Click link to sign in
- Verify redirect to `/dashboard`

#### 2. Create New Reference Check

- Click "New Check" in sidebar
- **Step 1 - Candidate**: Enter name, role, company, job description
- **Step 2 - References**: Add 2-4 references with name, phone, relationship
- **Step 3 - Template**: Select "Software Engineer Standard" or create custom
- **Step 4 - Review**: Verify all information, click "Launch"

#### 3. Launch CALL-E Calls

- After launching, verify status changes to "in_progress"
- Check that `call_status` for each reference updates to "calling"
- Verify CALL-E API is called (check backend logs)

#### 4. Sync Results (Without Webhook)

If running locally without public HTTPS (no webhook delivery):

- Navigate to candidate detail page
- Click "Refresh" button
- Verify call status updates to "completed"
- Check that scores are computed and displayed

#### 5. View Reference Report

- Navigate to candidate detail page
- Verify overall score ring displays correctly
- Click each reference panel to expand
- Verify per-question answers, scores, red flags, notable quotes
- Check recommendation badge (Strong Yes / Yes / Neutral / No)

#### 6. Download PDF Report

- Click "Download PDF Report" button
- Verify PDF downloads with candidate name, scores, reference details
- Check that formatting matches template

#### 7. Share Report

- Click "Share with Hiring Manager"
- Verify share link is generated
- Open share link in incognito window
- Verify read-only view (no referee contact details)
- Test PDF download from shared link

#### 8. Template Management

- Navigate to `/templates`
- View default templates
- Create custom template with custom questions
- Use custom template in new check
- Delete custom template

#### 9. Admin Bypass

With `NEXT_PUBLIC_ADMIN_EMAIL` set to your email:

- Verify "Admin" badge appears in sidebar
- Verify all features work without Polar.sh subscription
- Test unlimited checks, custom templates, PDF share

---

## Test Environment Setup

### Backend Environment Variables

Create `backend/.env`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# CALL-E
CALLE_API_KEY=your-calle-api-key
CALLE_BASE_URL=https://api.heycall-e.com
CALLE_WEBHOOK_TOKEN=generate-a-long-random-string
CALLE_DIAL_ALLOWLIST=+14155550142,+15555550100  # For place_test_call.py

# Resend
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=refcheck@yourdomain.com

# App URLs
APP_URL=http://localhost:3000
API_URL=http://localhost:8000

# Admin
ADMIN_EMAIL=your-email@example.com
```

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin
NEXT_PUBLIC_ADMIN_EMAIL=your-email@example.com

# Polar.sh (optional for testing)
NEXT_PUBLIC_POLAR_ORG=your-polar-org-slug
POLAR_ACCESS_TOKEN=your-polar-access-token
POLAR_WEBHOOK_SECRET=your-polar-webhook-secret
```

### Generating CALLE_WEBHOOK_TOKEN

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Troubleshooting

### Unit Tests Fail

- Ensure virtual environment is activated
- Install dev dependencies: `pip install -r requirements-dev.txt`
- Check Python version (requires 3.12+)

### CALL-E Integration Test Fails

- Verify `CALLE_API_KEY` is set (not placeholder)
- Add phone number to `CALLE_DIAL_ALLOWLIST`
- Check phone number is valid E.164 format
- Ensure you have CALL-E credits available

### Web App Authentication Fails

- Verify Supabase project is running
- Check email settings in Supabase (SMTP for magic links)
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

### CALL-E Calls Not Triggered

- Check backend logs for errors
- Verify `CALLE_API_KEY` is set in backend `.env`
- Ensure candidate has at least one reference
- Check that reference phone numbers are valid

### Results Not Syncing

- If running locally without HTTPS, use the "Refresh" button
- Check backend logs for CALL-E API errors
- Verify call IDs are stored in database
- Test `/api/candidates/{id}/sync` endpoint directly

### PDF Generation Fails

- Ensure WeasyPrint is installed: `pip install weasyprint`
- Check that `templates/report.html` exists
- Verify Jinja2 template syntax is valid
