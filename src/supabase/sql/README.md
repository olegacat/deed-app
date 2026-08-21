# Billing SQL

## Source of truth: `billing_plans` (Supabase)

```
Admin / SQL  →  billing_plans  →  Checkout UI + Stripe charge
                  (name, price,
                   recurring)
```

**You control products in your database.** Change `amount_cents`, `name`, `active` anytime — the app picks it up on the next page load / checkout. No redeploy, no Stripe Product edit.

Stripe only processes the payment amount built from the row at session creation (`price_data`).

## Files

| File | Purpose |
|------|---------|
| `001_billing_plans.sql` | Catalog table (`id` = uuid) |
| `002_subscriptions.sql` | Who paid / subscription status |
| `003_seed_billing_plans.sql` | Single $49 + Firm $149/mo (fixed UUIDs) |
| `004_billing_plans_uuid_migration.sql` | Drop old text-id table if you already ran an earlier schema |

## Example admin change

```sql
update public.billing_plans
set name = 'Single package (promo)',
    amount_cents = 3900
where id = '11111111-1111-4111-8111-111111111101';
```

Checkout and Pay button show $39 immediately.

## Plan IDs

Each plan has a **uuid** primary key (`gen_random_uuid()`). Seed rows use stable UUIDs so dev fallback matches Supabase. Add new plans in admin or SQL — no slug like `monthly` required.

## Next steps

- Webhook → `subscriptions` when payment succeeds
- Optional: store plan perks in DB (currently derived from one-time vs recurring)
