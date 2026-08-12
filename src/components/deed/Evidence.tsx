import { useState } from "react";
import type { StateInfo } from "@/data/states";
import type { DeedForm } from "@/components/deed/IntakeForm";

type Item = {
  label: string;
  value: string;
  note: string;
  tag: "LIVE" | "PENDING DEED";
  confidence: number;
};

export function EvidenceStep({
  state,
  form,
  onBack,
  onConfirm,
  onRestart,
}: {
  state: StateInfo;
  form: DeedForm;
  onBack: () => void;
  onConfirm: () => void;
  onRestart: () => void;
}) {
  const hasLiveData = Boolean(form.dataProvider);
  const priorRef =
    form.deedBook && form.deedPage
      ? `Book ${form.deedBook}, Page ${form.deedPage}`
      : form.deedBook || form.deedPage
        ? [form.deedBook, form.deedPage].filter(Boolean).join(" / ")
        : "— (not on roll)";

  const items: Item[] = [
    {
      label: "Current owner (→ new grantor)",
      value: form.owner || (form.ownerFromDeed ? "From deed of record (not on public layer)" : "Owner of record"),
      note: form.ownerFromDeed
        ? "Public parcel layer does not carry owner — grantor must come from the last recorded deed."
        : "Primary owner on the live assessment roll — becomes the grantor on the new deed.",
      tag: form.owner && !form.ownerFromDeed ? "LIVE" : "PENDING DEED",
      confidence: form.owner && !form.ownerFromDeed ? 97 : 40,
    },
    {
      label: "Parcel / tax map ID",
      value: form.parcel || "Pending parcel ID",
      note: form.dataProvider
        ? `From ${form.dataProvider}.`
        : "Print-key / parcel identifier from the live assessment record.",
      tag: hasLiveData ? "LIVE" : "PENDING DEED",
      confidence: hasLiveData ? 99 : 50,
    },
    {
      label: "County / recording district",
      value: form.county || "—",
      note: `Recording jurisdiction used for ${state.name} form selection.`,
      tag: "LIVE",
      confidence: 99,
    },
    {
      label: "Property class",
      value: form.propertyClass || (form.singleFamily ? "Single-family residential" : "Other / non single-family"),
      note: "Property classification from the assessment roll — drives rate variants.",
      tag: hasLiveData && form.propertyClass ? "LIVE" : "PENDING DEED",
      confidence: hasLiveData && form.propertyClass ? 98 : 70,
    },
    {
      label: "Consideration",
      value: form.nominal ? "Nominal ($10 and other valuable consideration)" : `$${form.consideration || "0"}`,
      note: "As entered at intake — verify against the contract before recording.",
      tag: "LIVE",
      confidence: 90,
    },
    {
      label: "Prior recording reference",
      value: priorRef,
      note: "Prior deed book/page carried on the live assessment record when available.",
      tag: form.deedBook || form.deedPage ? "LIVE" : "PENDING DEED",
      confidence: form.deedBook || form.deedPage ? 85 : 40,
    },
    {
      label: "Legal description (Schedule A)",
      value: form.legalDescription || "Pending recorded-deed image",
      note: form.legalDescription
        ? "Short legal from GIS — verify against the recorded deed before filing."
        : "Schedule A lives on the recorded deed image — flagged for live retrieval and human confirmation.",
      tag: form.legalDescription ? "LIVE" : "PENDING DEED",
      confidence: form.legalDescription ? 75 : 40,
    },
  ];

  const [sel, setSel] = useState(0);
  const active = items[sel] ?? items[0]!;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl leading-none text-foreground">Review the evidence</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every value traces to its source. Select a field to see where it came from.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
        <ol className="space-y-2">
          {items.map((it, i) => (
            <li key={it.label}>
              <button
                type="button"
                onClick={() => setSel(i)}
                className={`w-full border px-4 py-3 text-left transition-colors ${
                  sel === i
                    ? "border-accent bg-accent/5"
                    : "border-border bg-card hover:border-accent/40"
                }`}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {it.label}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] ${
                      it.tag === "LIVE"
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-border bg-secondary text-muted-foreground"
                    }`}
                  >
                    {it.tag}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                    {it.confidence}%
                  </span>
                </span>
                <span className="mt-1 block text-sm font-semibold text-foreground">{it.value}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="border border-border bg-card p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Source</p>
          <h3 className="mt-2 font-display text-xl text-foreground">
            {state.name} assessment record — {form.county || "county"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {state.openDataLabel ? `${state.openDataLabel} · ` : ""}Roll year 2026 · live lookup
          </p>

          <dl className="mt-5 divide-y divide-border border border-border">
            {items.map((it) => (
              <div key={it.label} className="grid grid-cols-2 gap-3 px-4 py-2.5">
                <dt className="text-xs text-muted-foreground">{it.label}</dt>
                <dd
                  className={`text-xs ${
                    it.label === active.label
                      ? "bg-accent/15 font-semibold text-foreground"
                      : "text-foreground"
                  }`}
                >
                  {it.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{active.note}</p>
        </div>
      </div>

      <div className="no-print flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-sm border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-accent hover:text-accent"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="bg-accent px-6 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-accent-foreground transition-opacity hover:opacity-90"
        >
          Looks right → continue
        </button>
        <span className="text-xs text-muted-foreground">
          Most fields are live and source-linked; only Schedule A awaits the deed image.
        </span>
        <button
          type="button"
          onClick={onRestart}
          className="ml-auto text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-accent"
        >
          ↺ Start over
        </button>
      </div>
    </div>
  );
}
