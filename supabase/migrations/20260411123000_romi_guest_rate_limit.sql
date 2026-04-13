create table if not exists public.romi_guest_rate_limit_buckets (
  fingerprint_hash text not null,
  bucket_start timestamptz not null,
  hit_count integer not null default 0 check (hit_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (fingerprint_hash, bucket_start)
);

create index if not exists romi_guest_rate_limit_buckets_bucket_idx
  on public.romi_guest_rate_limit_buckets (bucket_start desc);

create or replace function public.consume_romi_guest_rate_limit(
  p_fingerprint_hash text,
  p_bucket_start timestamptz,
  p_window_start timestamptz,
  p_limit integer default 10
)
returns table (allowed boolean, hit_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_hits integer;
begin
  delete from public.romi_guest_rate_limit_buckets
  where bucket_start < (p_window_start - interval '1 day');

  select coalesce(sum(bucket.hit_count), 0)
  into current_hits
  from public.romi_guest_rate_limit_buckets bucket
  where bucket.fingerprint_hash = p_fingerprint_hash
    and bucket.bucket_start >= p_window_start;

  if current_hits >= p_limit then
    return query select false, current_hits;
    return;
  end if;

  insert into public.romi_guest_rate_limit_buckets (
    fingerprint_hash,
    bucket_start,
    hit_count
  )
  values (
    p_fingerprint_hash,
    p_bucket_start,
    1
  )
  on conflict (fingerprint_hash, bucket_start)
  do update
    set hit_count = public.romi_guest_rate_limit_buckets.hit_count + 1,
        updated_at = now();

  return query select true, current_hits + 1;
end;
$$;

revoke all on function public.consume_romi_guest_rate_limit(text, timestamptz, timestamptz, integer) from public;
grant execute on function public.consume_romi_guest_rate_limit(text, timestamptz, timestamptz, integer) to service_role;
