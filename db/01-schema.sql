-- AnyPick Postgres DDL
-- 方針: マルチテナント(tenant_id) + イベントトークン(公開用) + ログはappend-only
-- gen_random_uuid() は Postgres 13+ 標準（pgcrypto 不要）

-- Extensions（citext 用に必要なら）
-- create extension if not exists citext;

-- 1) Tenants (主催者組織)
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 2) Admin users (主催者ユーザー)
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  email text not null, -- citext を使う場合は citext に変更
  password_hash text, -- magic link運用なら不要でもOK
  role text not null check (role in ('organizer_admin','organizer_viewer','super_admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (email)
);
create index idx_admin_users_tenant on admin_users(tenant_id);

-- 3) Events
create table events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  event_token text not null unique,
  name text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  venue_name text,
  rules_text text not null default '',
  share_caption_template text not null default '',
  share_hashtags text[] not null default '{}',
  share_targets text[] not null default '{instagram,x}',
  submission_max_per_person int not null default 1,
  retake_max_count int not null default 3,
  require_ticket_code boolean not null default false,
  status text not null default 'active' check (status in ('active','paused','ended')),
  consent_template_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_events_tenant on events(tenant_id);

-- 4) Consent templates（同意文言のバージョン管理）
create table consent_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null default 'default',
  version int not null,
  text text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(tenant_id, name, version)
);
alter table events add constraint fk_events_consent
  foreign key (consent_template_id) references consent_templates(id);

-- 5) Frames（フレーム素材）
create table frames (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  storage_key text not null,
  width int,
  height int,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index idx_frames_event on frames(event_id);

-- 6) QR sources（入口別QR）
create table qr_sources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  code text not null,
  label text,
  created_at timestamptz not null default now(),
  unique(event_id, code)
);

-- 7) Ticket codes（ワンタイムQR：P1）
create table ticket_codes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  code text not null,
  status text not null default 'unused' check (status in ('unused','claimed','used','revoked')),
  claimed_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  unique(event_id, code)
);
create index idx_ticket_event_status on ticket_codes(event_id, status);

-- 8) User sessions（scan単位）
create table user_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  qr_source_id uuid references qr_sources(id),
  ticket_id uuid references ticket_codes(id),
  client_fingerprint text,
  created_at timestamptz not null default now()
);
create index idx_sessions_event on user_sessions(event_id);
create index idx_sessions_qr_source on user_sessions(qr_source_id);

-- 9) Media assets（画像）
create table media_assets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  session_id uuid not null references user_sessions(id) on delete cascade,
  storage_key text not null,
  content_type text not null,
  byte_size int,
  width int,
  height int,
  created_at timestamptz not null default now()
);
create index idx_media_event on media_assets(event_id);

-- 10) Submissions（応募＝提出）
create table submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  session_id uuid not null references user_sessions(id) on delete cascade,
  media_asset_id uuid not null references media_assets(id),
  contact_email text,
  consent_agree_reuse boolean not null default false,
  consent_template_id uuid references consent_templates(id),
  consent_version int,
  status text not null default 'valid' check (status in ('valid','invalid','deleted')),
  admin_tags text[] not null default '{}',
  admin_note text,
  created_at timestamptz not null default now(),
  unique(event_id, session_id)
);
create index idx_submissions_event on submissions(event_id);
create index idx_submissions_consent on submissions(event_id, consent_agree_reuse);

-- 11) Metrics events（計測ログ：append-only）
create table metrics_events (
  id bigserial primary key,
  event_id uuid not null references events(id) on delete cascade,
  session_id uuid not null references user_sessions(id) on delete cascade,
  type text not null check (type in ('scan','camera_complete','save_click','outbound_click','submit_complete')),
  platform text,
  qr_source_id uuid references qr_sources(id),
  created_at timestamptz not null default now()
);
create index idx_metrics_event_time on metrics_events(event_id, created_at);
create index idx_metrics_session on metrics_events(session_id);

-- 12) Audit logs（P2：誰がDLしたか等）
create table audit_logs (
  id bigserial primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  admin_user_id uuid references admin_users(id),
  action text not null,
  target_type text,
  target_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_tenant_time on audit_logs(tenant_id, created_at);
