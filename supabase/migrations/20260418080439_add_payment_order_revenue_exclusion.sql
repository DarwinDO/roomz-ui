-- Allow admins to exclude paid payment orders from revenue reporting

alter table public.payment_orders
    add column if not exists exclude_from_revenue boolean not null default false;

comment on column public.payment_orders.exclude_from_revenue is
'When true, the order remains paid but is excluded from admin revenue totals.';

create index if not exists idx_payment_orders_status_revenue_exclusion
    on public.payment_orders (status, exclude_from_revenue);

drop policy if exists "Admins can view all payment orders" on public.payment_orders;
create policy "Admins can view all payment orders"
on public.payment_orders
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all payment reviews" on public.manual_reviews;
create policy "Admins can view all payment reviews"
on public.manual_reviews
for select
to authenticated
using (public.is_admin());

create or replace function public.set_payment_order_revenue_exclusion(
    p_order_id uuid,
    p_exclude boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_order public.payment_orders%rowtype;
begin
    if not public.is_admin() then
        raise exception 'Only admins can manage payment revenue exclusions';
    end if;

    select *
    into v_order
    from public.payment_orders
    where id = p_order_id
    for update;

    if not found then
        raise exception 'Payment order not found';
    end if;

    if p_exclude and v_order.status <> 'paid' then
        raise exception 'Only paid orders can be excluded from revenue';
    end if;

    update public.payment_orders
    set exclude_from_revenue = p_exclude,
        updated_at = now()
    where id = v_order.id;
end;
$$;

revoke all on function public.set_payment_order_revenue_exclusion(uuid, boolean) from public, anon;
grant execute on function public.set_payment_order_revenue_exclusion(uuid, boolean) to authenticated;

comment on function public.set_payment_order_revenue_exclusion(uuid, boolean) is
'Allows admins to include or exclude a paid payment order from revenue reporting without changing the payment status.';
