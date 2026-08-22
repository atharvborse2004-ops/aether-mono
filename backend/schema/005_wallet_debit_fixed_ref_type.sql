-- Applied to Supabase via MCP. Forward-only — never edit once applied.
--
-- 003 shipped wallet_debit() with `p_ref_type text default 'order'`. The
-- default meant no caller ever passed it, which hid what the signature
-- actually allows: any authenticated client can call the RPC directly and
-- choose the label, because the only thing checking that argument is the
-- table CHECK, and that CHECK permits all four values.
--
-- No money is gained — it is a debit either way — so this is not a hole in
-- rule 3 of backend/INSTRUCTIONS.md. It is a hole in the ledger's meaning,
-- which is worse later than it is now:
--
--   * `ref_type = 'payment'` renders as method "UPI" in the wallet UI
--     (toLedgerRow in src/store.jsx), so a client can write itself a debit
--     that reads as a card payment it never made.
--   * `ref_type` is what phase 3 reconciles Razorpay settlements against and
--     what phase 5 joins orders on. Rows a client chose the type of are rows
--     that reconciliation has to distrust.
--
-- Every phase-2 purchase is an order, so the value is fixed here rather than
-- accepted. When phase 3 needs to write a 'payment' row it will do it from
-- the webhook handler, server-side, where the type is a fact rather than an
-- argument.

drop function if exists public.wallet_debit(integer, text, text);

create or replace function public.wallet_debit(
  p_amount_paise integer,
  p_kind         text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_balance integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'Sign in to pay from your wallet.');
  end if;

  if p_amount_paise is null or p_amount_paise <= 0
     or coalesce(btrim(p_kind), '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'That is not something we can charge for.');
  end if;

  -- The lock is the concurrency control. Two debits firing at once serialise
  -- here, so they cannot both read the same balance and both pass the check.
  select balance_paise into v_balance
    from public.wallets
   where profile_id = v_uid
     for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'No wallet on this account.');
  end if;

  if p_amount_paise > v_balance then
    -- The string the front end has always shown. The server's job is to make
    -- it true, not to invent a second vocabulary (backend/INSTRUCTIONS.md §2).
    return jsonb_build_object('ok', false, 'reason', 'Not enough balance',
                              'balance_paise', v_balance);
  end if;

  -- Fixed, not passed. See the header.
  insert into public.ledger (wallet_id, delta_paise, kind, ref_type)
  values (v_uid, -p_amount_paise, p_kind, 'order');

  return jsonb_build_object('ok', true, 'balance_paise', v_balance - p_amount_paise);
end;
$$;

revoke execute on function public.wallet_debit(integer, text) from public, anon;
grant  execute on function public.wallet_debit(integer, text) to authenticated;
