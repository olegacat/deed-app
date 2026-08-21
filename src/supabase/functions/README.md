# Supabase Edge Functions

All server logic lives under **`_shared/`** — this folder is self-contained and deploys without the frontend `src/` tree.

## Layout

```
supabase/functions/
  _shared/
    deed-form.types.ts
    tax.ts                    # computeTax + formatUSD
    nj/engine.ts, forms.ts    # NJ document + tax engine
    package-compute/run.ts    # tax-summary + package actions
    parcel-lookup/            # NY, NYC, NJ, CT, NC, PA, FL connectors
  parcel-lookup/index.ts
  package-compute/index.ts
  fetch-package-pdf/index.ts
  _shared/cors.ts
```

The frontend only calls these via `supabase.functions.invoke()` — it does not contain parcel connectors, tax formulas, or NJ engine code.

## Deploy

From anywhere (only `supabase/` + linked project needed):

```bash
cd supabase
npx supabase login
npx supabase link --project-ref cpcgcnlbcmqkgeabfiyn
npx supabase functions deploy
npx supabase secrets set PDF_SERVICE_URL=https://deedcopilot.netlify.app
```

Or from repo root:

```bash
npx supabase functions deploy
```

## Functions

| Name | Role |
|------|------|
| `parcel-lookup` | Live parcel search |
| `package-compute` | `{ action: "tax-summary" }` or `{ action: "package", stateCode, form }` |
| `fetch-package-pdf` | Proxy to deedcopilot.netlify.app fill-forms |

## Local test

```bash
npx supabase start
npx supabase functions serve --env-file ../.env
```
