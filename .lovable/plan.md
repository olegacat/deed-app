## Deed Copilot — prototype build plan

A client-only React app (TanStack Start template already in place, no database, no accounts) with a state picker landing page and a two-step per-state wizard.

### Design direction
PandaDoc-inspired legal-tech look: navy `#1c2b4a` primary, muted blue accents, warm off-white background, amber/green/gray status pills, generous whitespace, soft card borders and subtle shadows. Sans-serif UI type; the deed preview uses a serif face to read like paper. All colors added as semantic tokens in `src/styles.css` (no hardcoded color classes).

### Routes
```
/                       state picker landing
/deed/$state            wizard (step state held in component: intake -> package)
```
`src/routes/index.tsx` gets rewritten (placeholder removed). Each route defines its own SEO head().

### Data layer (static TS modules, no backend)
- `src/data/states.ts` — all 50 states + DC + NYC: code, name, status (live / beta / coming-soon), grid row/col for the tile map, county list, card copy.
- `src/data/tax-rules.ts` — per-state transfer/excise tax rules with the real rates and form names:
  - NY: TP-584, IT-2663, RP-5217; $2 per $500 state RETT, Peconic Bay CPF, mansion tax
  - NYC: RPTT + ACRIS, NYC-RPT, RP-5217NYC
  - NJ: RTF graduated + GIT/REP, RTF-1/1EE
  - CT: conveyance-tax tiers, OP-236
  - PA: 1% state + local realty transfer tax
  - FL: doc stamps 0.70% (Miami-Dade 0.60% + $0.45/100 surtax on non-single-family), no state form — stamps paid to the Clerk
  - NC: excise $1 per $500; Land Transfer Tax counties
  - MA: deeds excise 0.456% (Barnstable 0.648%)
  - MD: state transfer 0.5% + county transfer + recordation
  - WA: REET graduated 1.10–3.00% + local
  - MN: deed tax 0.33% (0.34% Hennepin/Ramsey ERF)
  - All other states: a generic engine entry flagged "research-grade".
- Beta/coming-soon states use the same engine with a research-grade badge.

### Screen 1 — landing
Top bar (D logo, brand, tagline, PROTOTYPE badge) · hero heading + supplied subtext · generated hero illustration (three stacked layers: deed / evidence / source data) · SVG-grid US map of state tiles color-coded by status with hover tooltip + aria-label, click navigates to the wizard · legend · card grid for the 10 live states + NYC with LIVE badges, jurisdiction-specific one-liners and "Start a [state] deed →" · an "Every other state — on the map" card · footer disclaimer.

### Screen 2, step 1 — Intake
Back button, brand + state subtitle, state LIVE/BETA badge, step indicator. Main card: county select (full alphabetical county list), house/street/city, property-type toggle where it changes the rate (FL surtax, others), owner "From deed of record", parcel/folio. Three actions: Use entered parcel / Try live lookup / Clear, plus a link to the state's open-data page. "You provide" section: grantee type, deed type, grantee name(s), consideration toggle + amount, date, prepared-by name & address (with per-state requirement note), buyer/seller attorneys, additional grantees. "Build package →" disabled until a parcel is used or found, with hint.

Right sidebar "What's live vs. provided": REAL / BEST-EFFORT / FROM DEED badges with state-specific copy, plus the verification callout.

Live lookup: a fetch with an 8s timeout to the state's public open-data endpoint (NY Socrata `data.ny.gov`, FL/WA/NC ArcGIS FeatureServer where public) — no keys, no auth. Any failure or timeout falls back cleanly to "manual entry is the reliable path" without blocking the flow.

### Screen 2, step 2 — Package
Header with address/county subtitle, "⬇ Complete package (PDF)" and "⤓ Print" buttons · bundle callout including the state recording quirk · "Review & to-do" 4-column panel (Confirmed / Verify against the deed / You still need to provide / Compliance flags) with count badges, computed from the actual form state and tax rules · document chip list with REQUIRED / AUTO-ADDED marks + tax computation table · serif deed preview with DRAFT watermark, bracketed placeholders and the highlighted "[Pending recorded-deed retrieval]" legal-description block · footer disclaimer · "↺ Start over".

Export: print CSS + `window.print()` for both buttons (PDF via the browser print-to-PDF dialog), so no PDF dependency is needed.

### Technical notes
- All state lives in the wizard route component; no persistence.
- Components split under `src/components/deed/` (StateMap, StateCard, IntakeForm, HonestyPanel, ReviewPanel, DeedPreview, TaxTable, StatusBadge).
- Tax computation is a pure function in `src/lib/tax.ts` so figures are consistent between the review panel and the table.
- Honesty badges and disclaimers appear on every screen — treated as product features, not boilerplate.
