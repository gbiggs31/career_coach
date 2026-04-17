create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  name text,
  timezone text not null default 'UTC',
  password_hash text,
  created_at timestamptz not null default now()
);

create table if not exists user_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists weekly_checkins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  week_start_date date not null,
  week_end_date date not null,
  status text not null check (status in ('draft', 'submitted')) default 'draft',
  submitted_at timestamptz,
  raw_payload_json jsonb,
  raw_combined_text text,
  summary_text text,
  summary_bullets_json jsonb,
  next_focus_text text,
  mood_score numeric,
  confidence_score numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);

create table if not exists weekly_answers (
  id uuid primary key default uuid_generate_v4(),
  checkin_id uuid not null references weekly_checkins(id) on delete cascade,
  question_key text not null,
  question_text text not null,
  answer_text text not null default '',
  created_at timestamptz not null default now(),
  unique (checkin_id, question_key)
);

create table if not exists weekly_extractions (
  id uuid primary key default uuid_generate_v4(),
  checkin_id uuid not null unique references weekly_checkins(id) on delete cascade,
  wins_json jsonb not null default '[]'::jsonb,
  challenges_json jsonb not null default '[]'::jsonb,
  learnings_json jsonb not null default '[]'::jsonb,
  next_week_goals_json jsonb not null default '[]'::jsonb,
  blockers_json jsonb not null default '[]'::jsonb,
  projects_json jsonb not null default '[]'::jsonb,
  stakeholders_json jsonb not null default '[]'::jsonb,
  decisions_json jsonb not null default '[]'::jsonb,
  themes_json jsonb not null default '[]'::jsonb,
  confidence_notes_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  canonical_goal_text text not null,
  status text not null check (status in ('active', 'completed', 'paused', 'dropped')) default 'active',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  completion_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists goal_mentions (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid not null references goals(id) on delete cascade,
  checkin_id uuid not null references weekly_checkins(id) on delete cascade,
  mention_text text not null,
  progress_status text,
  created_at timestamptz not null default now(),
  unique (goal_id, checkin_id)
);

create table if not exists themes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  canonical_theme_name text not null,
  description text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists theme_mentions (
  id uuid primary key default uuid_generate_v4(),
  theme_id uuid not null references themes(id) on delete cascade,
  checkin_id uuid not null references weekly_checkins(id) on delete cascade,
  mention_text text not null,
  sentiment text,
  created_at timestamptz not null default now(),
  unique (theme_id, checkin_id)
);

create table if not exists career_state (
  user_id uuid primary key references users(id) on delete cascade,
  active_priorities_json jsonb not null default '[]'::jsonb,
  active_challenges_json jsonb not null default '[]'::jsonb,
  current_goals_json jsonb not null default '[]'::jsonb,
  recurring_themes_json jsonb not null default '[]'::jsonb,
  recent_wins_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  chunk_text text not null,
  chunk_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists document_embeddings (
  document_id uuid primary key references documents(id) on delete cascade,
  embedding_json jsonb
);

create index if not exists idx_weekly_checkins_user_week on weekly_checkins (user_id, week_start_date desc);
create index if not exists idx_documents_user_source on documents (user_id, source_type, source_id);
create index if not exists idx_documents_text_search on documents using gin (to_tsvector('english', chunk_text));
create index if not exists idx_user_sessions_user_id on user_sessions (user_id);
