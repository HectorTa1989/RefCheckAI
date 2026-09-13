-- RefCheck AI — Initial Schema
-- Run this in the Supabase SQL editor

-- ─────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- Profiles (extends Supabase auth.users)
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text unique not null,
  full_name       text,
  company_name    text,
  is_admin        boolean default false,
  polar_customer_id text,
  plan            text default 'free',         -- free | pro | team
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile"  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- Question Templates
-- ─────────────────────────────────────────────
create table if not exists public.question_templates (
  id          uuid primary key default uuid_generate_v4(),
  recruiter_id uuid references auth.users(id) on delete cascade,  -- null = system template
  name        text not null,
  description text,
  questions   jsonb not null default '[]',
  is_default  boolean default false,
  is_system   boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.question_templates enable row level security;
create policy "Users see system templates and their own"
  on public.question_templates for select
  using (is_system = true or recruiter_id = auth.uid());
create policy "Users manage their own templates"
  on public.question_templates for all
  using (recruiter_id = auth.uid());

-- ─────────────────────────────────────────────
-- Candidates
-- ─────────────────────────────────────────────
create type candidate_status as enum ('draft', 'pending', 'in_progress', 'complete', 'cancelled');
create type recommendation_type as enum ('strong_yes', 'yes', 'neutral', 'no', 'strong_no');

create table if not exists public.candidates (
  id                    uuid primary key default uuid_generate_v4(),
  recruiter_id          uuid not null references auth.users(id) on delete cascade,
  name                  text not null,
  email                 text,
  role_applied_for      text not null,
  company_name          text not null,
  job_description_summary text,
  template_id           uuid references public.question_templates(id),
  status                candidate_status default 'draft',
  overall_score         decimal(4,2),
  recommendation        recommendation_type,
  share_token           uuid default uuid_generate_v4(),
  share_enabled         boolean default false,
  completed_at          timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table public.candidates enable row level security;
create policy "Recruiters manage own candidates"
  on public.candidates for all using (recruiter_id = auth.uid());
create policy "Share token access"
  on public.candidates for select
  using (share_enabled = true);

-- ─────────────────────────────────────────────
-- References
-- ─────────────────────────────────────────────
create type call_status as enum ('queued', 'calling', 'completed', 'failed', 'no_answer', 'declined');
create type enthusiasm_level as enum ('very_enthusiastic', 'positive', 'neutral', 'hesitant', 'negative');

create table if not exists public.references (
  id                      uuid primary key default uuid_generate_v4(),
  candidate_id            uuid not null references public.candidates(id) on delete cascade,
  referee_name            text not null,
  referee_phone           text not null,
  referee_email           text,
  relationship            text not null,
  company_at_time         text,
  call_status             call_status default 'queued',
  calle_call_sid          text,
  transcript              text,
  answers                 jsonb default '{}',
  red_flags               jsonb default '[]',
  strengths               jsonb default '[]',
  notable_quotes          jsonb default '[]',
  referee_enthusiasm      enthusiasm_level,
  overall_reference_score decimal(4,2),
  would_rehire            boolean,
  call_duration_seconds   integer,
  call_outcome            text,
  spoke_with_referee      boolean,
  summary                 text,
  completed_at            timestamptz,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

alter table public.references enable row level security;
create policy "Recruiters access their candidate references"
  on public.references for all
  using (
    exists (
      select 1 from public.candidates c
      where c.id = references.candidate_id
        and c.recruiter_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- Audit log
-- ─────────────────────────────────────────────
create table if not exists public.audit_log (
  id          uuid primary key default uuid_generate_v4(),
  recruiter_id uuid references auth.users(id),
  action      text not null,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

alter table public.audit_log enable row level security;
create policy "Users see own audit log"
  on public.audit_log for select using (recruiter_id = auth.uid());

-- ─────────────────────────────────────────────
-- Seed: System question templates
-- ─────────────────────────────────────────────
insert into public.question_templates (name, description, is_system, is_default, questions) values
(
  'Standard',
  'General-purpose reference check for most roles',
  true, true,
  '[
    {"id":"q_relationship","text":"Can you describe your working relationship with {candidate_name} and how long you worked together?","type":"open","follow_up":null},
    {"id":"q_role","text":"What were {candidate_name}'\''s main responsibilities in their role?","type":"open","follow_up":null},
    {"id":"q_strengths","text":"What would you say are {candidate_name}'\''s greatest professional strengths?","type":"open","follow_up":"Can you give me a specific example?"},
    {"id":"q_areas_for_growth","text":"What areas do you think {candidate_name} could continue to develop professionally?","type":"open","follow_up":null},
    {"id":"q_achievement","text":"Can you tell me about a specific project or achievement of {candidate_name}'\''s that stands out?","type":"open","follow_up":null},
    {"id":"q_under_pressure","text":"How did {candidate_name} perform under pressure or during challenging situations?","type":"open","follow_up":null},
    {"id":"q_collaboration","text":"How well did {candidate_name} collaborate with others on the team?","type":"open","follow_up":null},
    {"id":"q_rehire","text":"If you had the opportunity, would you work with or hire {candidate_name} again?","type":"boolean","follow_up":"Can you tell me more about that?"},
    {"id":"q_fit","text":"We are considering {candidate_name} for a {role} role that involves {jd_summary}. How do you think they would perform in that context?","type":"open","follow_up":null}
  ]'::jsonb
),
(
  'Software Engineer',
  'Technical reference check for engineering roles',
  true, false,
  '[
    {"id":"q_relationship","text":"Can you describe your working relationship with {candidate_name} and how long you worked together?","type":"open","follow_up":null},
    {"id":"q_technical","text":"How would you describe {candidate_name}'\''s technical abilities? What technologies did they work with?","type":"open","follow_up":"Can you give a specific example of their best technical work?"},
    {"id":"q_problem_solving","text":"Can you describe a difficult technical problem {candidate_name} solved? How did they approach it?","type":"open","follow_up":null},
    {"id":"q_code_quality","text":"How would you describe {candidate_name}'\''s code quality and engineering practices?","type":"open","follow_up":null},
    {"id":"q_collaboration","text":"How did {candidate_name} collaborate with non-technical teammates?","type":"open","follow_up":null},
    {"id":"q_learning","text":"How quickly did {candidate_name} pick up new technologies or frameworks?","type":"open","follow_up":null},
    {"id":"q_under_pressure","text":"How did {candidate_name} handle tight deadlines or production incidents?","type":"open","follow_up":null},
    {"id":"q_rehire","text":"Would you hire {candidate_name} again for an engineering role?","type":"boolean","follow_up":"What would be the main reason?"},
    {"id":"q_fit","text":"We are considering {candidate_name} for a {role} role involving {jd_summary}. How do you think they would perform?","type":"open","follow_up":null}
  ]'::jsonb
),
(
  'Sales',
  'Reference check optimized for sales and business development roles',
  true, false,
  '[
    {"id":"q_relationship","text":"Can you describe how you worked with {candidate_name} and in what capacity?","type":"open","follow_up":null},
    {"id":"q_quota","text":"Did {candidate_name} consistently meet or exceed their targets?","type":"open","follow_up":"What was their typical attainment?"},
    {"id":"q_pipeline","text":"How did {candidate_name} manage their pipeline and stay organized?","type":"open","follow_up":null},
    {"id":"q_customer","text":"How did customers and prospects respond to {candidate_name}?","type":"open","follow_up":null},
    {"id":"q_objections","text":"How well did {candidate_name} handle objections or difficult negotiations?","type":"open","follow_up":null},
    {"id":"q_collaboration","text":"How did {candidate_name} work with marketing, product, or other internal teams?","type":"open","follow_up":null},
    {"id":"q_coachability","text":"How did {candidate_name} respond to coaching or feedback?","type":"open","follow_up":null},
    {"id":"q_rehire","text":"Would you hire {candidate_name} for a sales role again?","type":"boolean","follow_up":"Can you tell me more?"},
    {"id":"q_fit","text":"We are considering {candidate_name} for a {role} position. How do you think they would perform?","type":"open","follow_up":null}
  ]'::jsonb
),
(
  'Leadership',
  'Reference check for manager and director-level candidates',
  true, false,
  '[
    {"id":"q_relationship","text":"In what capacity did you work with {candidate_name} and for how long?","type":"open","follow_up":null},
    {"id":"q_team_building","text":"How did {candidate_name} build and develop their team?","type":"open","follow_up":"Can you give a specific example?"},
    {"id":"q_decision_making","text":"Can you describe how {candidate_name} made difficult decisions?","type":"open","follow_up":null},
    {"id":"q_strategic","text":"How did {candidate_name} think strategically and set direction for their team?","type":"open","follow_up":null},
    {"id":"q_conflict","text":"How did {candidate_name} handle conflict or underperformance on the team?","type":"open","follow_up":null},
    {"id":"q_cross_functional","text":"How did {candidate_name} work with peers and senior leadership?","type":"open","follow_up":null},
    {"id":"q_results","text":"What were the most significant business outcomes {candidate_name} drove?","type":"open","follow_up":null},
    {"id":"q_rehire","text":"Would you want {candidate_name} leading a team at your company again?","type":"boolean","follow_up":"What makes you say that?"},
    {"id":"q_fit","text":"We are hiring {candidate_name} for a {role} role. How do you see them performing at a leadership level?","type":"open","follow_up":null}
  ]'::jsonb
);

-- ─────────────────────────────────────────────
-- Updated_at trigger helper
-- ─────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger candidates_updated_at before update on public.candidates
  for each row execute procedure update_updated_at();
create trigger references_updated_at before update on public.references
  for each row execute procedure update_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure update_updated_at();

-- Grant admin flag for configured admin email (run after setting your email)
-- update public.profiles set is_admin = true, plan = 'team'
-- where email = 'your-admin@email.com';
