create or replace function public.provision_cakto_purchase(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_payment_id text,
  p_amount numeric,
  p_payment_method text,
  p_approved_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_created boolean := false;
begin
  insert into public.profiles as profiles (id, email, full_name)
  values (p_user_id, p_email, p_full_name)
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, profiles.full_name),
        updated_at = now();

  insert into public.orders (
    user_id,
    payment_id,
    status,
    amount,
    payment_method,
    approved_at
  )
  values (
    p_user_id,
    p_payment_id,
    'approved',
    p_amount,
    p_payment_method,
    p_approved_at
  )
  on conflict (payment_id) do nothing
  returning id into v_order_id;

  if v_order_id is not null then
    v_created := true;
  else
    select orders.id
      into v_order_id
      from public.orders
      where orders.payment_id = p_payment_id;
  end if;

  return jsonb_build_object(
    'order_id', v_order_id,
    'created', v_created
  );
end;
$$;

revoke execute on function public.provision_cakto_purchase(uuid, text, text, text, numeric, text, timestamptz) from public;
revoke execute on function public.provision_cakto_purchase(uuid, text, text, text, numeric, text, timestamptz) from anon;
revoke execute on function public.provision_cakto_purchase(uuid, text, text, text, numeric, text, timestamptz) from authenticated;
grant execute on function public.provision_cakto_purchase(uuid, text, text, text, numeric, text, timestamptz) to service_role;
