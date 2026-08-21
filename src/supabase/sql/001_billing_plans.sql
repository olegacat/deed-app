-- Step 1 · billing_plans — SOURCE OF TRUTH for pricing (edit via admin / SQL anytime)
--
-- Admin changes name, price, recurring here → Checkout + Stripe charge update immediately.
-- Stripe is only the payment processor; it does not own the catalog.

create extension if not exists "pgcrypto";

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd' check (char_length(currency) = 3),
  is_recurring boolean not null default false,
  billing_interval text check (
    billing_interval is null
    or billing_interval in ('day', 'week', 'month', 'year')
  ),
  sort_order smallint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_plans_recurring_interval check (
    (is_recurring = false and billing_interval is null)
    or (is_recurring = true and billing_interval is not null)
  )
);

comment on table public.billing_plans is
  'Source of truth for checkout pricing. Admin edits propagate to app without redeploy.';
comment on column public.billing_plans.amount_cents is
  'Price in cents — sent to Stripe Checkout as price_data on each session.';

create index if not exists billing_plans_active_sort_idx
  on public.billing_plans (active, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists billing_plans_set_updated_at on public.billing_plans;
create trigger billing_plans_set_updated_at
  before update on public.billing_plans
  for each row execute function public.set_updated_at();

alter table public.billing_plans enable row level security;

drop policy if exists billing_plans_read_active on public.billing_plans;
create policy billing_plans_read_active
  on public.billing_plans
  for select
  to authenticated, anon
  using (active = true);
