create table if not exists public.romi_feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint romi_feature_flags_key_check check (
    key in (
      'romi_normalization_v2',
      'romi_knowledge_gating_v1',
      'romi_auto_broaden_v1'
    )
  )
);

alter table public.romi_feature_flags enable row level security;

insert into public.romi_feature_flags (key, enabled, description)
values
  ('romi_normalization_v2', true, 'Enable safe-fail normalization and POI-first room-search orchestration.'),
  ('romi_knowledge_gating_v1', true, 'Restrict ROMI knowledge retrieval during room-search and repair flows.'),
  ('romi_auto_broaden_v1', false, 'Allow safe budget broadening after exact and same-district proximity fallback.')
on conflict (key) do update
set
  enabled = excluded.enabled,
  description = excluded.description,
  updated_at = timezone('utc', now());
