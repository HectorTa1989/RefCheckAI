-- RefCheck AI — CALL-E integration
-- Run in the Supabase SQL editor after 001_initial.sql.
--
-- Adds what the real CALL-E Developer API contract needs:
--   * at-least-once webhook delivery  → an event-id ledger for de-duplication
--   * the dashboard-visible Call Record ID, which is separate from the call id

-- ─────────────────────────────────────────────
-- Webhook event ledger
-- ─────────────────────────────────────────────
-- CALL-E delivers terminal events at least once, so the receiver claims an
-- event id here before running any side effect. The unique constraint is what
-- makes a duplicate delivery a no-op.
create table if not exists public.calle_webhook_events (
  event_id     text primary key,           -- the `id` on the event envelope
  event_type   text not null,              -- call.completed | call.failed | call.result_validation_failed
  call_id      text not null,              -- data.id  (call_…)
  received_at  timestamptz default now()
);

create index if not exists calle_webhook_events_call_id_idx
  on public.calle_webhook_events (call_id);

-- Written only by the backend service-role key; no client should read it.
alter table public.calle_webhook_events enable row level security;

-- ─────────────────────────────────────────────
-- References: keep the provider call id
-- ─────────────────────────────────────────────
-- `calle_call_sid` holds the Calls API call id (call_…), which is what
-- GET /v1/calls/{call_id} takes. The Call Record ID shown in the CALL-E
-- dashboard is recipients[].attempts[].provider_call_id — a different value,
-- nullable, and per attempt. Store it separately for support lookups.
alter table public.references
  add column if not exists calle_provider_call_id text;

comment on column public.references.calle_call_sid is
  'CALL-E Calls API call id (call_…). Use with GET /v1/calls/{call_id}.';
comment on column public.references.calle_provider_call_id is
  'CALL-E dashboard Call Record ID (recipients[].attempts[].provider_call_id). Nullable.';
