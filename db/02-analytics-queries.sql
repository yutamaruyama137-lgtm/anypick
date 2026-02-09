-- 集計用サンプルSQL（Supabase SQL Editor 用）
-- 各クエリを実行する前に、下の params の event_id を実際の UUID に書き換えてください。

-- ========== パラメータ（ここを編集してから各クエリを実行） ==========
-- 例: events テーブルで event_id を確認し、下の '00000000-0000-0000-0000-000000000000' を置き換える
-- with params as (
--   select
--     '00000000-0000-0000-0000-000000000000'::uuid as event_id,
--     (now() - interval '7 days')::timestamptz as from_ts,
--     now()::timestamptz as to_ts,
--     null::text as qr_source_code  -- 入口別にする場合は 'gateA' など
-- )

-- 1) サマリー（1行で各指標）
with params as (
  select
    '00000000-0000-0000-0000-000000000000'::uuid as event_id,
    (now() - interval '7 days')::timestamptz as from_ts,
    now()::timestamptz as to_ts,
    null::text as qr_source_code
)
select
  count(*) filter (where m.type = 'scan') as scan,
  count(*) filter (where m.type = 'camera_complete') as camera_complete,
  count(*) filter (where m.type = 'save_click') as save_click,
  count(*) filter (where m.type = 'outbound_click') as outbound_click,
  count(*) filter (where m.type = 'submit_complete') as submit_complete
from metrics_events m
join user_sessions s on s.id = m.session_id
cross join params p
where m.event_id = p.event_id
  and m.created_at >= p.from_ts
  and m.created_at < p.to_ts
  and (p.qr_source_code is null or exists (
    select 1 from qr_sources q where q.id = s.qr_source_id and q.code = p.qr_source_code
  ));

-- 2) outbound_click を platform 別に集計
with params as (
  select
    '00000000-0000-0000-0000-000000000000'::uuid as event_id,
    (now() - interval '7 days')::timestamptz as from_ts,
    now()::timestamptz as to_ts,
    null::text as qr_source_code
)
select
  m.platform,
  count(*) as cnt
from metrics_events m
join user_sessions s on s.id = m.session_id
cross join params p
where m.event_id = p.event_id
  and m.type = 'outbound_click'
  and m.created_at >= p.from_ts
  and m.created_at < p.to_ts
  and (p.qr_source_code is null or exists (
    select 1 from qr_sources q where q.id = s.qr_source_id and q.code = p.qr_source_code
  ))
group by m.platform;

-- 3) 時系列（group_by=hour）
with params as (
  select
    '00000000-0000-0000-0000-000000000000'::uuid as event_id,
    (now() - interval '7 days')::timestamptz as from_ts,
    now()::timestamptz as to_ts,
    null::text as qr_source_code
)
select
  date_trunc('hour', m.created_at) as bucket,
  count(*) filter (where m.type = 'scan') as scan,
  count(*) filter (where m.type = 'submit_complete') as submit_complete
from metrics_events m
join user_sessions s on s.id = m.session_id
cross join params p
where m.event_id = p.event_id
  and m.created_at >= p.from_ts
  and m.created_at < p.to_ts
  and (p.qr_source_code is null or exists (
    select 1 from qr_sources q where q.id = s.qr_source_id and q.code = p.qr_source_code
  ))
group by date_trunc('hour', m.created_at)
order by bucket;

-- 4) 同意率（同意あり応募数 / 応募総数）
with params as (
  select
    '00000000-0000-0000-0000-000000000000'::uuid as event_id,
    (now() - interval '7 days')::timestamptz as from_ts,
    now()::timestamptz as to_ts
)
select
  count(*) as total,
  count(*) filter (where sub.consent_agree_reuse) as consent_agree,
  count(*) filter (where sub.consent_agree_reuse)::float / nullif(count(*), 0) as consent_agree_rate
from submissions sub
cross join params p
where sub.event_id = p.event_id
  and sub.created_at >= p.from_ts
  and sub.created_at < p.to_ts
  and sub.status = 'valid';
