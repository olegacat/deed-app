# Deed Navigator

Build a single-page React web app called "Deed Copilot" (just UI, not need a database) — a prototype tool that helps

attorneys and paralegals prepare property transfer deeds and recording documents.

This is a PROTOTYPE for attorney/title review, not a production legal product —

every screen must make that clear.

=== OVERALL FLOW ===

Two-step wizard per state: (1) Intake → (2) Package. A state picker landing page

sits in front of both steps.

=== SCREEN 1: LANDING / STATE PICKER ===

- Top bar: logo "D", brand name "Deed Copilot" with tagline "Evidence-backed deed &

  recording-doc prep", and a "PROTOTYPE" badge.

- Hero: heading "Pick your state". Subtext: "All 50 states + DC now have a

  transfer-tax engine and deed generator. Ten go deepest with verified rates —

  New York, New Jersey, Connecticut, Pennsylvania, Florida, North Carolina,

  Massachusetts, Maryland, Washington and Minnesota — plus a dedicated New York

  City / ACRIS module. Click any state to start."

- Hero image: a simple illustration showing "the deed on top, an evidence layer

  beneath it, and the source data below — each field traced to its source."

- A clickable US map (SVG grid of state tiles) color-coded by status:

  Live (green), Beta (yellow/amber), Coming soon (gray). Hovering a tile shows

  its name and status as a tooltip/aria-label.

- Below the map: a legend and a row of "state cards" for the ~10 Live states +

  NYC, each showing:

  - A "LIVE" badge (or "LIVE · ACRIS" for NYC)

  - State name

  - One-line description of exactly what's real: county count, data source name,

    which specific tax/recording forms are auto-filled (be state-specific and

    accurate — e.g., NY: "TP-584, IT-2663, RP-5217"; FL: "doc-stamp engine 0.70%;

    Miami-Dade 0.60% + surtax"; MA: "deeds excise engine 0.456%; Barnstable 0.648%")

  - A "Start a [state] deed →" call to action

- One extra card for "Every other state — on the map", explaining beta states

  have a tax engine + deed generator with "research-grade" rates, and that live

  parcel data + verified rates are coming state by state.

- Footer disclaimer: "Prototype for attorney/title review — illustrative drafts,

  not legal advice, not recording-ready."

=== SCREEN 2, STEP 1: INTAKE (per selected state) ===

- Top bar changes to: "← States" back button, brand + state name subtitle

  (e.g., "Florida · 67 counties · statewide cadastral"), and a state-specific

  "LIVE" badge.

- Step indicator: "1. Intake" (active) → "2. Package".

- Left/main card: "New deed file · [State]"

  - County dropdown (every county in the state, alphabetical)

  - House #, Street, City fields

  - Property type toggle (e.g., Single-family / Other) where it affects the

    tax rate

  - Owner (optional) field, explicitly labeled "From deed of record"

  - Parcel/folio # (optional) field

  - Three action buttons: "✓ Use entered parcel", "⌕ Try live lookup",

    "✕ Clear" — plus a link out to the state's own open-data/cadastral page

  - A "You provide" section, explicitly separated from the auto-fillable data,

    labeled "the new-grantee facts. Grantor comes from the deed of record.":

    - Grantee type (Individual / Corporation / Partnership / Estate-Trust / LLC / Other)

    - Deed type (Warranty / Special Warranty / Quitclaim)

    - New grantee name(s)

    - Consideration: toggle (Nominal/gift vs. Sale price) + amount field

    - Date of conveyance

    - "Prepared by" name & address (note if required by that state)

    - Buyer's attorney / Seller's attorney fields

    - Additional grantees textarea

  - "Build package →" button, disabled until a parcel is used or found, with

    a hint: "Use / find a parcel first."

- Right sidebar card: "What's live vs. provided" — three honesty badges:

  - REAL (green): describe the actual, correct tax formula for this state/county

  - BEST-EFFORT (yellow): the live-lookup layer against the state's open data —

    explicitly say it can time out and manual entry is the reliable path

  - FROM DEED (blue/neutral): owner/vesting + legal description come from the

    recorded deed, not the cadastral — not automated yet

  - A closing callout confirming the tax rate has been verified against the

    state's official schedule, and that output is a draft for attorney/title

    review before recording.

=== SCREEN 2, STEP 2: PACKAGE OUTPUT ===

- Step indicator now shows "1. Intake" done, "2. Package" active.

- Header: "Prepared package", property address/county subtitle, and two buttons:

  "⬇ Complete package (PDF)" and "⤓ Print".

- Callout describing what's bundled: cover + review checklist, the deed itself,

  a tax computation + recording data page, and a tax summary — note any

  state-specific recording quirk (e.g., "Florida has no state transfer form —

  stamps are paid to the Clerk at recording").

- "Review & to-do" panel with a 4-column breakdown, each with a count badge:

  - Confirmed (green) — fields resolved from data or entry

  - Verify against the deed (yellow) — things that must be checked against the

    actual recorded instrument (owner/vesting, legal description, any

    state-specific note like homestead protections)

  - You still need to provide (gray) — fields not yet filled (grantee name,

    date, prepared-by info)

  - Compliance flags (red/orange) — jurisdiction-specific tax/rate flags,

    phrased as plain-language warnings, not just numbers

- Document panel: a chip list of the documents in the package (DEED, tax/stamp

  form, recording authority, any auto-added local surtax/fee), each marked

  REQUIRED or AUTO-ADDED, plus a small tax computation table.

- Generated deed preview: styled like an actual paper document (serif heading,

  "DRAFT" watermark language), with editable-looking placeholder fields

  ([new grantee], [Prepared by — name & address]) and the legal description

  shown as a highlighted placeholder block reading something like

  "carried on the prior recorded instrument ... [Pending recorded-deed

  retrieval]" if that data isn't available yet.

- Footer disclaimer restating the data-source honesty (what's live vs. from

  the Clerk of Court vs. illustrative) and that this is not recording-ready.

- "↺ Start over / change inputs" button.

=== TONE & CONTENT RULES ===

- Be radically honest in-product about what's real vs. best-effort vs. missing.

  Never imply full automation where there is none — the badges and disclaimers

  are a core feature, not boilerplate.

- Use correct, specific, jurisdiction-accurate tax figures and form names —

  this product's credibility depends on precision, even in a prototype.

- Keep the visual style clean and professional (legal-tech, not consumer-flashy):

  a navy/muted-blue palette, card-based layout, small badge pills, generous

  whitespace.

=== TECHNICAL NOTES FOR THIS PROTOTYPE STAGE ===

- Single-page React app (Vite), client-side only is acceptable for this stage —

  no backend, no accounts, no payments.

- Any "live lookup" can call free public government data sources directly from

  the browser (e.g., state open-data/Socrata or ArcGIS FeatureServer endpoints)

  since this is a prototype — do not add authentication or paid API keys at

  this stage.

- PDF/print export can be generated client-side.

- Mock/hardcode data for jurisdictions not yet live; real states should attempt

  a real API call with a graceful manual-entry fallback on failure/timeout.

For design look&feel reference use:
https://www.pandadoc.com/

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://deed-compass-draft.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/aa4f1482-07e9-4e8a-af7b-4783f3c98501).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
