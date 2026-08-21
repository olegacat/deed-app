-- Step 3 · Initial plans (edit anytime in Supabase or admin UI)
-- Fixed UUIDs so dev fallback and seed stay in sync.

insert into public.billing_plans (
  id,
  name,
  description,
  amount_cents,
  currency,
  is_recurring,
  billing_interval,
  sort_order,
  active
) values
  (
    '11111111-1111-4111-8111-111111111101',
    'Single package',
    'One deed package for this property — draft deed, recording forms, transfer-tax worksheet, PDF export.',
    4900,
    'usd',
    false,
    null,
    1,
    true
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'Firm monthly',
    'Unlimited deed packages across all live states — saved matters in your account.',
    14900,
    'usd',
    true,
    'month',
    2,
    true
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  amount_cents = excluded.amount_cents,
  currency = excluded.currency,
  is_recurring = excluded.is_recurring,
  billing_interval = excluded.billing_interval,
  sort_order = excluded.sort_order,
  active = excluded.active,
  updated_at = now();

-- Change price from admin / SQL — no Stripe Dashboard visit required:
-- update public.billing_plans set amount_cents = 5900 where id = '11111111-1111-4111-8111-111111111101';
