-- Cinder Roll Call schema
-- Run this in the Supabase SQL editor once per project.

create table if not exists platoons (
  id          bigserial primary key,
  name        text not null unique,
  ping_role_id text,                       -- stored as text because Discord IDs are 64-bit
  created_at  timestamptz not null default now()
);

create table if not exists squads (
  id          bigserial primary key,
  platoon_id  bigint not null references platoons(id) on delete cascade,
  name        text not null,                   -- e.g. "Cinder 1", "Cinder 1-1"
  kind        text not null check (kind in ('squad','section','reserve')),
  sort_order  int not null default 0
);
create index if not exists ix_squads_platoon on squads(platoon_id, sort_order);

create table if not exists webhooks (
  id          bigserial primary key,
  platoon_id  bigint not null references platoons(id) on delete cascade,
  label       text not null,                   -- human label, e.g. "#cinder-rollcall"
  url         text not null,                   -- full Discord webhook URL (keep secret)
  created_at  timestamptz not null default now()
);
create index if not exists ix_webhooks_platoon on webhooks(platoon_id);
