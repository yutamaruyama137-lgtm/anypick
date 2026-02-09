-- Row Level Security (RLS) の有効化
-- このアプリは管理・参加者APIをすべて Next.js の service_role で操作しているため、
-- anon / authenticated には一切アクセスさせない（ポリシーを付けない = デフォルト拒否）。
-- service_role は RLS をバイパスするため、既存の挙動は変わらない。
-- 効果: anon キーが漏れてもこれらのテーブルは読めない（多層防御）。

alter table tenants enable row level security;
alter table admin_users enable row level security;
alter table events enable row level security;
alter table consent_templates enable row level security;
alter table frames enable row level security;
alter table qr_sources enable row level security;
alter table ticket_codes enable row level security;
alter table user_sessions enable row level security;
alter table media_assets enable row level security;
alter table submissions enable row level security;
alter table metrics_events enable row level security;
alter table audit_logs enable row level security;

-- ポリシーはあえて作成しない。
-- anon / authenticated には「許可するポリシー」が無いため、すべて拒否される。
-- 管理・参加者APIは service_role のみでアクセスするため、このままでよい。
