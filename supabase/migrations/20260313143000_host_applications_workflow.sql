create table if not exists public.host_applications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references public.users(id) on delete cascade,
    phone text,
    address text,
    property_count integer check (property_count is null or property_count >= 1),
    experience text,
    description text,
    status text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected', 'revoked')),
    source text not null default 'user_submission' check (source in ('user_submission', 'legacy_user_state', 'admin_created')),
    submitted_at timestamptz not null default now(),
    reviewed_at timestamptz,
    reviewed_by uuid references public.users(id) on delete set null,
    rejection_reason text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_host_applications_status_submitted
    on public.host_applications (status, submitted_at desc);

create index if not exists idx_host_applications_reviewed_by
    on public.host_applications (reviewed_by, reviewed_at desc);

alter table public.host_applications enable row level security;

drop policy if exists "Users can view own host applications" on public.host_applications;
create policy "Users can view own host applications"
on public.host_applications for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can view all host applications" on public.host_applications;
create policy "Admins can view all host applications"
on public.host_applications for select
to authenticated
using (public.is_admin());

create or replace function public.update_host_applications_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists host_applications_updated_at_trigger on public.host_applications;
create trigger host_applications_updated_at_trigger
before update on public.host_applications
for each row
execute function public.update_host_applications_updated_at();

insert into public.host_applications (
    user_id,
    phone,
    address,
    property_count,
    experience,
    description,
    status,
    source,
    submitted_at,
    reviewed_at,
    rejection_reason,
    metadata
)
select
    u.id,
    nullif(trim(u.phone), ''),
    nullif(trim((u.preferences::jsonb -> 'landlord_application' ->> 'address')), ''),
    nullif((u.preferences::jsonb -> 'landlord_application' ->> 'property_count'), '')::integer,
    nullif(trim((u.preferences::jsonb -> 'landlord_application' ->> 'experience')), ''),
    nullif(trim((u.preferences::jsonb -> 'landlord_application' ->> 'description')), ''),
    'submitted',
    'legacy_user_state',
    coalesce(
        nullif((u.preferences::jsonb -> 'landlord_application' ->> 'applied_at'), '')::timestamptz,
        u.updated_at,
        u.created_at,
        now()
    ),
    null,
    u.rejection_reason,
    jsonb_build_object('backfilled_from', 'users.preferences.landlord_application')
from public.users u
where u.account_status = 'pending_landlord'
  and not exists (
      select 1
      from public.host_applications ha
      where ha.user_id = u.id
  );

insert into public.host_applications (
    user_id,
    phone,
    address,
    property_count,
    experience,
    description,
    status,
    source,
    submitted_at,
    reviewed_at,
    reviewed_by,
    rejection_reason,
    metadata
)
select
    u.id,
    nullif(trim(u.phone), ''),
    nullif(trim((u.preferences::jsonb -> 'landlord_application' ->> 'address')), ''),
    nullif((u.preferences::jsonb -> 'landlord_application' ->> 'property_count'), '')::integer,
    nullif(trim((u.preferences::jsonb -> 'landlord_application' ->> 'experience')), ''),
    nullif(trim((u.preferences::jsonb -> 'landlord_application' ->> 'description')), ''),
    'approved',
    'legacy_user_state',
    coalesce(
        nullif((u.preferences::jsonb -> 'landlord_application' ->> 'applied_at'), '')::timestamptz,
        u.created_at,
        now()
    ),
    coalesce(u.updated_at, u.created_at, now()),
    null,
    null,
    jsonb_build_object('backfilled_from', 'legacy_landlord_role')
from public.users u
where u.role = 'landlord'
  and not exists (
      select 1
      from public.host_applications ha
      where ha.user_id = u.id
  );

create or replace function public.get_my_host_application()
returns table (
    application_id uuid,
    status text,
    phone text,
    address text,
    property_count integer,
    experience text,
    description text,
    source text,
    submitted_at timestamptz,
    reviewed_at timestamptz,
    reviewed_by uuid,
    rejection_reason text,
    metadata jsonb,
    created_at timestamptz,
    updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
    select
        ha.id as application_id,
        ha.status,
        ha.phone,
        ha.address,
        ha.property_count,
        ha.experience,
        ha.description,
        ha.source,
        ha.submitted_at,
        ha.reviewed_at,
        ha.reviewed_by,
        ha.rejection_reason,
        ha.metadata,
        ha.created_at,
        ha.updated_at
    from public.host_applications ha
    where ha.user_id = auth.uid()
    limit 1;
$$;

create or replace function public.submit_host_application(
    p_phone text,
    p_address text,
    p_property_count integer,
    p_experience text default null,
    p_description text default null
)
returns public.host_applications
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid := auth.uid();
    v_application public.host_applications%rowtype;
begin
    if v_user_id is null then
        raise exception 'Authentication required';
    end if;

    if nullif(trim(coalesce(p_phone, '')), '') is null then
        raise exception 'Phone is required';
    end if;

    if nullif(trim(coalesce(p_address, '')), '') is null then
        raise exception 'Address is required';
    end if;

    if p_property_count is null or p_property_count < 1 then
        raise exception 'Property count must be at least 1';
    end if;

    if exists (
        select 1
        from public.users u
        where u.id = v_user_id
          and u.role = 'landlord'
    ) then
        raise exception 'User is already an approved host';
    end if;

    insert into public.host_applications (
        user_id,
        phone,
        address,
        property_count,
        experience,
        description,
        status,
        source,
        submitted_at,
        reviewed_at,
        reviewed_by,
        rejection_reason,
        metadata
    )
    values (
        v_user_id,
        trim(p_phone),
        trim(p_address),
        p_property_count,
        nullif(trim(coalesce(p_experience, '')), ''),
        nullif(trim(coalesce(p_description, '')), ''),
        'submitted',
        'user_submission',
        now(),
        null,
        null,
        null,
        jsonb_build_object(
            'submitted_from', 'web_form',
            'submission_count', 1
        )
    )
    on conflict (user_id) do update
    set phone = excluded.phone,
        address = excluded.address,
        property_count = excluded.property_count,
        experience = excluded.experience,
        description = excluded.description,
        status = 'submitted',
        source = 'user_submission',
        submitted_at = now(),
        reviewed_at = null,
        reviewed_by = null,
        rejection_reason = null,
        metadata = jsonb_build_object(
            'submitted_from', 'web_form',
            'submission_count',
            coalesce((host_applications.metadata ->> 'submission_count')::integer, 0) + 1,
            'previous_status',
            host_applications.status
        )
    returning * into v_application;

    update public.users
    set phone = trim(p_phone),
        account_status = 'pending_landlord',
        rejection_reason = null,
        updated_at = now()
    where id = v_user_id;

    insert into public.notifications (
        user_id,
        type,
        title,
        content,
        link,
        data
    )
    values (
        v_user_id,
        'system',
        'Đơn host đã được gửi',
        'RommZ đã nhận đơn đăng ký làm host của bạn. Chúng tôi sẽ xem xét trong 24-48 giờ làm việc.',
        '/become-host',
        jsonb_build_object(
            'application_id', v_application.id,
            'status', v_application.status
        )
    );

    return v_application;
end;
$$;

create or replace function public.admin_review_host_application(
    p_application_id uuid,
    p_status text,
    p_rejection_reason text default null
)
returns public.host_applications
language plpgsql
security definer
set search_path = public
as $$
declare
    v_actor uuid := auth.uid();
    v_application public.host_applications%rowtype;
    v_reason text := nullif(trim(coalesce(p_rejection_reason, '')), '');
begin
    if v_actor is null then
        raise exception 'Authentication required';
    end if;

    if not public.is_admin() then
        raise exception 'Admin privileges required';
    end if;

    if p_status not in ('approved', 'rejected') then
        raise exception 'Invalid host application status';
    end if;

    select *
    into v_application
    from public.host_applications
    where id = p_application_id
    for update;

    if not found then
        raise exception 'Host application not found';
    end if;

    if v_application.status <> 'submitted' then
        raise exception 'Only submitted host applications can be reviewed';
    end if;

    if p_status = 'rejected' and v_reason is null then
        raise exception 'Rejection reason is required';
    end if;

    update public.host_applications
    set status = p_status,
        reviewed_at = now(),
        reviewed_by = v_actor,
        rejection_reason = case when p_status = 'rejected' then v_reason else null end
    where id = p_application_id
    returning * into v_application;

    if p_status = 'approved' then
        update public.users
        set role = 'landlord',
            account_status = 'active',
            rejection_reason = null,
            updated_at = now()
        where id = v_application.user_id;

        insert into public.notifications (
            user_id,
            type,
            title,
            content,
            link,
            data
        )
        values (
            v_application.user_id,
            'system',
            'Đơn host đã được phê duyệt',
            'Bạn đã được phê duyệt làm host. Hãy mở Host console để bắt đầu đăng tin và quản lý listing.',
            '/host',
            jsonb_build_object(
                'application_id', v_application.id,
                'status', v_application.status
            )
        );
    else
        update public.users
        set account_status = 'active',
            rejection_reason = v_reason,
            updated_at = now()
        where id = v_application.user_id;

        insert into public.notifications (
            user_id,
            type,
            title,
            content,
            link,
            data
        )
        values (
            v_application.user_id,
            'system',
            'Đơn host chưa được duyệt',
            'RommZ cần bạn cập nhật lại hồ sơ host trước khi phê duyệt. Lý do: ' || v_reason,
            '/become-host',
            jsonb_build_object(
                'application_id', v_application.id,
                'status', v_application.status,
                'reason', v_reason
            )
        );
    end if;

    return v_application;
end;
$$;

create or replace function public.admin_review_host_application_for_user(
    p_user_id uuid,
    p_status text,
    p_rejection_reason text default null
)
returns public.host_applications
language plpgsql
security definer
set search_path = public
as $$
declare
    v_application_id uuid;
begin
    select id
    into v_application_id
    from public.host_applications
    where user_id = p_user_id
    limit 1;

    if v_application_id is null then
        raise exception 'Host application not found for user';
    end if;

    return public.admin_review_host_application(v_application_id, p_status, p_rejection_reason);
end;
$$;

create or replace function public.get_admin_host_applications(
    p_status text default null
)
returns table (
    application_id uuid,
    user_id uuid,
    user_name text,
    user_email text,
    user_avatar text,
    user_phone text,
    user_role text,
    user_account_status text,
    phone text,
    address text,
    property_count integer,
    experience text,
    description text,
    status text,
    source text,
    submitted_at timestamptz,
    reviewed_at timestamptz,
    reviewed_by uuid,
    reviewed_by_name text,
    rejection_reason text,
    metadata jsonb,
    created_at timestamptz,
    updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
    select
        ha.id as application_id,
        u.id as user_id,
        u.full_name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar,
        u.phone as user_phone,
        u.role::text as user_role,
        u.account_status::text as user_account_status,
        ha.phone,
        ha.address,
        ha.property_count,
        ha.experience,
        ha.description,
        ha.status,
        ha.source,
        ha.submitted_at,
        ha.reviewed_at,
        ha.reviewed_by,
        reviewer.full_name as reviewed_by_name,
        ha.rejection_reason,
        ha.metadata,
        ha.created_at,
        ha.updated_at
    from public.host_applications ha
    join public.users u on u.id = ha.user_id
    left join public.users reviewer on reviewer.id = ha.reviewed_by
    where p_status is null or ha.status = p_status
    order by
        case ha.status
            when 'submitted' then 0
            when 'rejected' then 1
            when 'approved' then 2
            else 3
        end,
        ha.submitted_at desc;
$$;

revoke all on function public.get_my_host_application() from public, anon;
grant execute on function public.get_my_host_application() to authenticated;

revoke all on function public.submit_host_application(text, text, integer, text, text) from public, anon;
grant execute on function public.submit_host_application(text, text, integer, text, text) to authenticated;

revoke all on function public.admin_review_host_application(uuid, text, text) from public, anon;
grant execute on function public.admin_review_host_application(uuid, text, text) to authenticated;

revoke all on function public.admin_review_host_application_for_user(uuid, text, text) from public, anon;
grant execute on function public.admin_review_host_application_for_user(uuid, text, text) to authenticated;

revoke all on function public.get_admin_host_applications(text) from public, anon;
grant execute on function public.get_admin_host_applications(text) to authenticated;
