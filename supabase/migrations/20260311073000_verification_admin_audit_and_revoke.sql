-- Verification admin operations, audit log, and revoke flow

create table if not exists public.verification_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    verification_request_id uuid references public.verification_requests(id) on delete set null,
    verification_type public.verification_type not null,
    event_type text not null check (event_type = any (array['approved', 'rejected', 'revoked'])),
    performed_by uuid references public.users(id) on delete set null,
    reason text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists verification_events_user_created_idx
    on public.verification_events (user_id, created_at desc);

create index if not exists verification_events_request_idx
    on public.verification_events (verification_request_id);

create index if not exists verification_events_type_idx
    on public.verification_events (verification_type, event_type, created_at desc);

alter table public.verification_events enable row level security;

drop policy if exists "Users can view own verification events" on public.verification_events;
create policy "Users can view own verification events"
on public.verification_events for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can view all verification events" on public.verification_events;
create policy "Admins can view all verification events"
on public.verification_events for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert verification events" on public.verification_events;
create policy "Admins can insert verification events"
on public.verification_events for insert
to authenticated
with check (public.is_admin());

create or replace function public.map_document_type_to_verification_type(p_document_type text)
returns public.verification_type
language plpgsql
immutable
set search_path = public
as $$
begin
    case coalesce(trim(lower(p_document_type)), '')
        when 'cccd' then
            return 'id_card'::public.verification_type;
        when 'id_card' then
            return 'id_card'::public.verification_type;
        when 'student_card' then
            return 'student_card'::public.verification_type;
        when 'room_photos' then
            return 'room_photos'::public.verification_type;
        when 'email' then
            return 'email'::public.verification_type;
        when 'phone' then
            return 'phone'::public.verification_type;
        else
            return 'id_card'::public.verification_type;
    end case;
end;
$$;

create or replace function public.log_verification_request_review_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if old.status is not distinct from new.status then
        return new;
    end if;

    if new.status not in ('approved', 'rejected') then
        return new;
    end if;

    insert into public.verification_events (
        user_id,
        verification_request_id,
        verification_type,
        event_type,
        performed_by,
        reason,
        metadata,
        created_at
    )
    select
        new.user_id,
        new.id,
        public.map_document_type_to_verification_type(new.document_type),
        new.status,
        new.reviewed_by,
        case when new.status = 'rejected' then new.rejection_reason else null end,
        jsonb_build_object(
            'source', 'verification_requests_trigger',
            'previous_status', old.status,
            'next_status', new.status,
            'reviewed_at', new.reviewed_at
        ),
        coalesce(new.reviewed_at, now())
    where not exists (
        select 1
        from public.verification_events ve
        where ve.verification_request_id = new.id
          and ve.event_type = new.status
    );

    return new;
end;
$$;

drop trigger if exists log_verification_request_review_event on public.verification_requests;
create trigger log_verification_request_review_event
after update of status on public.verification_requests
for each row
execute function public.log_verification_request_review_event();

create or replace function public.admin_review_verification_request(
    p_request_id uuid,
    p_status text,
    p_rejection_reason text default null
)
returns public.verification_requests
language plpgsql
security definer
set search_path = public
as $$
declare
    v_actor uuid := auth.uid();
    v_request public.verification_requests%rowtype;
begin
    if v_actor is null then
        raise exception 'Authentication required';
    end if;

    if not public.is_admin() then
        raise exception 'Admin privileges required';
    end if;

    if p_status not in ('approved', 'rejected') then
        raise exception 'Invalid verification status';
    end if;

    select *
    into v_request
    from public.verification_requests
    where id = p_request_id
    for update;

    if not found then
        raise exception 'Verification request not found';
    end if;

    if v_request.status <> 'pending' then
        raise exception 'Only pending verification requests can be reviewed';
    end if;

    update public.verification_requests
    set status = p_status,
        rejection_reason = case
            when p_status = 'rejected'
                then coalesce(nullif(trim(p_rejection_reason), ''), 'Giấy tờ không hợp lệ')
            else null
        end,
        reviewed_by = v_actor,
        reviewed_at = now()
    where id = p_request_id
    returning * into v_request;

    return v_request;
end;
$$;

create or replace function public.admin_revoke_user_verification(
    p_user_id uuid,
    p_verification_type public.verification_type,
    p_reason text
)
returns public.verification_events
language plpgsql
security definer
set search_path = public
as $$
declare
    v_actor uuid := auth.uid();
    v_reason text := coalesce(nullif(trim(p_reason), ''), 'Quản trị viên đã gỡ trạng thái xác thực');
    v_event public.verification_events%rowtype;
    v_request_id uuid;
    v_user public.users%rowtype;
begin
    if v_actor is null then
        raise exception 'Authentication required';
    end if;

    if not public.is_admin() then
        raise exception 'Admin privileges required';
    end if;

    if p_verification_type not in ('id_card', 'student_card') then
        raise exception 'Only id_card and student_card can be revoked from admin';
    end if;

    select *
    into v_user
    from public.users
    where id = p_user_id
    for update;

    if not found then
        raise exception 'User not found';
    end if;

    if p_verification_type = 'id_card' and not coalesce(v_user.id_card_verified, false) then
        raise exception 'User does not currently have id_card verification';
    end if;

    if p_verification_type = 'student_card' and not coalesce(v_user.student_card_verified, false) then
        raise exception 'User does not currently have student_card verification';
    end if;

    if p_verification_type = 'id_card' then
        update public.users
        set id_card_verified = false,
            updated_at = now()
        where id = p_user_id;

        select vr.id
        into v_request_id
        from public.verification_requests vr
        where vr.user_id = p_user_id
          and vr.status = 'approved'
        order by coalesce(vr.reviewed_at, vr.submitted_at) desc
        limit 1;
    else
        update public.users
        set student_card_verified = false,
            updated_at = now()
        where id = p_user_id;

        select v.id
        into v_request_id
        from public.verifications v
        where v.user_id = p_user_id
          and v.verification_type = p_verification_type
          and v.status = 'approved'
        order by coalesce(v.reviewed_at, v.submitted_at) desc
        limit 1;
    end if;

    insert into public.verification_events (
        user_id,
        verification_request_id,
        verification_type,
        event_type,
        performed_by,
        reason,
        metadata
    )
    values (
        p_user_id,
        v_request_id,
        p_verification_type,
        'revoked',
        v_actor,
        v_reason,
        jsonb_build_object(
            'source', 'admin_revoke',
            'had_request_reference', v_request_id is not null
        )
    )
    returning * into v_event;

    insert into public.notifications (
        user_id,
        type,
        title,
        content,
        link,
        data
    )
    values (
        p_user_id,
        'verification',
        'Xác thực đã bị gỡ',
        case
            when p_verification_type = 'id_card'
                then 'Trạng thái xác thực CCCD của bạn đã bị gỡ. Lý do: ' || v_reason
            else 'Trạng thái xác thực thẻ sinh viên của bạn đã bị gỡ. Lý do: ' || v_reason
        end,
        '/profile/verification',
        jsonb_build_object(
            'verification_type', p_verification_type,
            'event_id', v_event.id
        )
    );

    return v_event;
end;
$$;

create or replace function public.get_verified_users_admin()
returns table (
    user_id uuid,
    full_name text,
    email text,
    avatar_url text,
    id_card_verified boolean,
    student_card_verified boolean,
    verification_types text[],
    latest_approved_at timestamptz,
    latest_approved_by uuid,
    latest_approved_by_name text,
    latest_revoke_at timestamptz,
    latest_revoke_reason text,
    source_hint text
)
language sql
security definer
set search_path = public
as $$
    with latest_approved as (
        select distinct on (ve.user_id)
            ve.user_id,
            ve.created_at as approved_at,
            ve.performed_by as approved_by,
            reviewer.full_name as approved_by_name,
            coalesce(ve.metadata ->> 'source', 'event') as source_hint
        from public.verification_events ve
        left join public.users reviewer on reviewer.id = ve.performed_by
        where ve.event_type = 'approved'
        order by ve.user_id, ve.created_at desc
    ),
    latest_revoke as (
        select distinct on (ve.user_id)
            ve.user_id,
            ve.created_at as revoked_at,
            ve.reason
        from public.verification_events ve
        where ve.event_type = 'revoked'
        order by ve.user_id, ve.created_at desc
    )
    select
        u.id,
        u.full_name::text,
        u.email::text,
        u.avatar_url::text,
        coalesce(u.id_card_verified, false) as id_card_verified,
        coalesce(u.student_card_verified, false) as student_card_verified,
        array_remove(array[
            case when coalesce(u.id_card_verified, false) then 'id_card' end,
            case when coalesce(u.student_card_verified, false) then 'student_card' end
        ], null)::text[] as verification_types,
        la.approved_at,
        la.approved_by,
        la.approved_by_name::text,
        lr.revoked_at,
        lr.reason::text,
        coalesce(la.source_hint, 'legacy_manual')::text as source_hint
    from public.users u
    left join latest_approved la on la.user_id = u.id
    left join latest_revoke lr on lr.user_id = u.id
    where coalesce(u.id_card_verified, false)
       or coalesce(u.student_card_verified, false)
    order by coalesce(la.approved_at, lr.revoked_at) desc nulls last, u.updated_at desc nulls last, u.full_name asc;
$$;

create or replace function public.get_verification_audit_log_admin(p_limit integer default 100)
returns table (
    event_id uuid,
    user_id uuid,
    user_name text,
    user_email text,
    verification_type text,
    event_type text,
    reason text,
    created_at timestamptz,
    performed_by uuid,
    performed_by_name text,
    verification_request_id uuid,
    metadata jsonb
)
language sql
security definer
set search_path = public
as $$
    select
        ve.id as event_id,
        ve.user_id,
        target_user.full_name::text as user_name,
        target_user.email::text as user_email,
        ve.verification_type::text,
        ve.event_type,
        ve.reason,
        ve.created_at,
        ve.performed_by,
        actor.full_name::text as performed_by_name,
        ve.verification_request_id,
        ve.metadata
    from public.verification_events ve
    join public.users target_user on target_user.id = ve.user_id
    left join public.users actor on actor.id = ve.performed_by
    order by ve.created_at desc
    limit greatest(coalesce(p_limit, 100), 1);
$$;

create or replace function public.get_my_verification_status()
returns table (
    request_id uuid,
    status text,
    rejection_reason text,
    submitted_at timestamptz,
    reviewed_at timestamptz,
    is_currently_verified boolean,
    latest_event_type text,
    latest_event_reason text
)
language sql
security definer
set search_path = public
as $$
    with current_actor as (
        select auth.uid() as user_id
    ),
    latest_request as (
        select
            vr.id as request_id,
            vr.status,
            vr.rejection_reason,
            vr.submitted_at,
            vr.reviewed_at
        from public.verification_requests vr
        join current_actor cu on cu.user_id = vr.user_id
        order by vr.submitted_at desc
        limit 1
    ),
    latest_event as (
        select
            ve.event_type,
            ve.reason
        from public.verification_events ve
        join current_actor cu on cu.user_id = ve.user_id
        where ve.verification_type = 'id_card'
        order by ve.created_at desc
        limit 1
    ),
    current_flags as (
        select
            coalesce(u.id_card_verified, false) as is_currently_verified
        from public.users u
        join current_actor cu on cu.user_id = u.id
    )
    select
        lr.request_id,
        case
            when cf.is_currently_verified then 'approved'
            when le.event_type = 'revoked' then 'revoked'
            when lr.status in ('pending', 'rejected') then lr.status
            when lr.status = 'approved' and not cf.is_currently_verified then 'revoked'
            else 'unverified'
        end as status,
        case
            when le.event_type = 'revoked'
                then coalesce(le.reason, 'Xác thực đã bị gỡ bởi quản trị viên')
            else lr.rejection_reason
        end as rejection_reason,
        lr.submitted_at,
        lr.reviewed_at,
        cf.is_currently_verified,
        le.event_type as latest_event_type,
        le.reason as latest_event_reason
    from current_flags cf
    left join latest_request lr on true
    left join latest_event le on true;
$$;

grant select on public.verification_events to authenticated;
grant execute on function public.admin_review_verification_request(uuid, text, text) to authenticated;
grant execute on function public.admin_revoke_user_verification(uuid, public.verification_type, text) to authenticated;
grant execute on function public.get_verified_users_admin() to authenticated;
grant execute on function public.get_verification_audit_log_admin(integer) to authenticated;
grant execute on function public.get_my_verification_status() to authenticated;
grant execute on function public.map_document_type_to_verification_type(text) to authenticated;

insert into public.verification_events (
    user_id,
    verification_request_id,
    verification_type,
    event_type,
    performed_by,
    reason,
    metadata,
    created_at
)
select
    vr.user_id,
    vr.id,
    public.map_document_type_to_verification_type(vr.document_type),
    vr.status,
    vr.reviewed_by,
    case when vr.status = 'rejected' then vr.rejection_reason else null end,
    jsonb_build_object(
        'source', 'backfill_verification_request',
        'submitted_at', vr.submitted_at,
        'reviewed_at', vr.reviewed_at
    ),
    coalesce(vr.reviewed_at, vr.submitted_at)
from public.verification_requests vr
where vr.status in ('approved', 'rejected')
  and not exists (
      select 1
      from public.verification_events ve
      where ve.verification_request_id = vr.id
        and ve.event_type = vr.status
  );

insert into public.verification_events (
    user_id,
    verification_type,
    event_type,
    reason,
    metadata,
    created_at
)
select
    u.id,
    'id_card'::public.verification_type,
    'approved',
    'Backfilled from users.id_card_verified',
    jsonb_build_object('source', 'legacy_manual_user_flag'),
    now()
from public.users u
where coalesce(u.id_card_verified, false)
  and not exists (
      select 1
      from public.verification_events ve
      where ve.user_id = u.id
        and ve.verification_type = 'id_card'
        and ve.event_type = 'approved'
  );

insert into public.verification_events (
    user_id,
    verification_type,
    event_type,
    reason,
    metadata,
    created_at
)
select
    u.id,
    'student_card'::public.verification_type,
    'approved',
    'Backfilled from users.student_card_verified',
    jsonb_build_object('source', 'legacy_manual_user_flag'),
    now()
from public.users u
where coalesce(u.student_card_verified, false)
  and not exists (
      select 1
      from public.verification_events ve
      where ve.user_id = u.id
        and ve.verification_type = 'student_card'
        and ve.event_type = 'approved'
  );
