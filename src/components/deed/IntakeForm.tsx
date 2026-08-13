import type { StateInfo } from "@/data/states";
import { getJurisdictionConfig } from "@/lib/jurisdiction-config";
import { getIntakeProfile, NJ_EXEMPTIONS } from "@/lib/intake-profiles";
import { NY_TP584_CONDITIONS, NY_TP584_EXEMPTIONS } from "@/lib/ny-intake";
import type { ParcelRecord } from "@/lib/parcel-lookup";
import { hasLiveLookup } from "@/lib/parcel-lookup";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, X, ChevronDown, ExternalLink, Loader2 } from "lucide-react";

import type { DeedForm } from "@/lib/deed-form.types";
export type { DeedForm } from "@/lib/deed-form.types";

const GRANTEE_TYPES = [
  "Individual",
  "Corporation",
  "Partnership",
  "Estate / Trust",
  "LLC",
  "Other",
] as const;

export const emptyForm = (county: string, stateCode?: string): DeedForm => {
  const cfg = getJurisdictionConfig(stateCode ?? "");
  const intake = getIntakeProfile(stateCode ?? "");
  return {
    county,
    house: "",
    street: "",
    city: "",
    singleFamily: true,
    owner: "",
    parcel: "",
    block: "",
    lot: "",
    qual: "",
    propertyClass: "",
    propertyClassCode: "",
    assessmentTotal: "",
    acres: "",
    mailingZip: "",
    deedDate: "",
    marketValue: "",
    deedBook: "",
    deedPage: "",
    legalDescription: "",
    dataProvider: "",
    parcelSourceUrl: "",
    ownerFromDeed: false,
    granteeType:
      stateCode === "NY" ? "Estate / Trust" : "Individual",
    deedType: cfg.defaultDeedType,
    granteeName: "",
    nominal: intake.defaultNominal,
    consideration: "",
    date: "",
    preparedByName: "",
    preparedByAddress: "",
    buyerAttorney: "",
    sellerAttorney: "",
    additionalGrantees: "",
    mdFirstTimeBuyer: false,
    grantorIsResident: true,
    njExemption: NJ_EXEMPTIONS[0],
    exemptionDescribe: "",
    buyerAttorneyPhone: "",
    sellerAttorneyPhone: "",
    trusteeAddress: "",
    conditionOfConveyance: "a",
    exemptionCategory: "d",
    gainReported: false,
    creditLineMortgage: false,
    schoolDistrict: "",
    schoolCode: "",
  };
};

type LookupNoticeTone = "loading" | "success" | "error" | "info";

function lookupNoticeTone(
  text: string | null,
  parcelError: string | null,
  lookupLoading: boolean,
): LookupNoticeTone {
  if (parcelError) return "error";
  if (!text) return "info";
  if (lookupLoading || /^Querying\b/i.test(text) || /Searching/i.test(text)) return "loading";
  if (/^Loaded from\b/i.test(text) || /parcels? found/i.test(text)) return "success";
  if (/failed|No parcels matched|No live parcel connector/i.test(text)) return "error";
  if (/Enter a street|enter values manually|enter the parcel manually/i.test(text)) return "info";
  return "info";
}

const LOOKUP_NOTICE_STYLES: Record<LookupNoticeTone, string> = {
  loading: "border-accent/35 bg-accent/10 text-foreground",
  success: "border-success/45 bg-success/10 text-success",
  error: "border-destructive/40 bg-destructive/10 text-destructive",
  info: "border-border bg-secondary/60 text-muted-foreground",
};

const labelCls = "block text-xs font-semibold text-foreground";
const inputCls =
  "mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-accent/50 focus:border-ring focus:ring-2 focus:ring-ring/25";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SectionHeader({
  step,
  title,
  note,
}: {
  step: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
      <div className="flex items-baseline gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">{step}</span>
        <h3 className="font-display text-xl leading-none text-foreground">{title}</h3>
      </div>
      {note ? (
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {note}
        </span>
      ) : null}
    </div>
  );
}

export function Toggle({
  options,
  value,
  onChange,
}: {
  options: [string, string];
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="mt-1.5 grid grid-cols-2 gap-2">
      {options.map((opt, i) => {
        const active = value === (i === 0);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(i === 0)}
            className={`rounded-sm border px-3 py-2 text-sm font-semibold transition-colors ${
              active
                ? "border-accent bg-accent text-accent-foreground"
                : "border-input bg-card text-foreground hover:bg-secondary"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function SearchSelect({
  value,
  options,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? options.filter((o) => o.toLowerCase().includes(needle)) : options;
  }, [q, options]);

  return (
    <div ref={ref} className="relative mt-1.5">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setQ("");
        }}
        className="flex w-full items-center justify-between rounded-sm border border-input bg-card px-3 py-2 text-left text-sm text-foreground hover:border-accent/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25"
      >
        <span className={value ? "" : "text-muted-foreground"}>{value || placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-sm border border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered[0]) {
                  onChange(filtered[0]);
                  setOpen(false);
                }
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary ${
                    o === value ? "font-semibold text-accent" : "text-foreground"
                  }`}
                >
                  {o}
                  {o === value && <Check className="h-3.5 w-3.5" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function parcelMatchSubtitle(p: ParcelRecord) {
  if (p.state === "NY" && p.schoolDistrict) {
    const desc = p.propertyClassDesc || "—";
    const sd = p.schoolCode ? `${p.schoolDistrict} (${p.schoolCode})` : p.schoolDistrict;
    return `${desc} · ${sd}`;
  }
  const blockLot =
    p.block && p.lot
      ? ` · Block ${p.block} Lot ${p.lot}`
      : p.sbl && p.sbl.startsWith("Block ")
        ? ` · ${p.sbl}`
        : "";
  const desc = p.propertyClassDesc || p.ownerFull || "Owner per deed";
  return `${desc}${blockLot}`;
}

function ParcelCard({ form, live }: { form: DeedForm; live: boolean }) {
  const addr = [[form.house, form.street].filter(Boolean).join(" "), form.city]
    .filter(Boolean)
    .join(", ");
  return (
    <div
      className={`mt-4 rounded-sm border p-4 ${
        live ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/5"
      }`}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
        {live ? "Live parcel" : "Entered parcel"}
      </p>
      <p className="text-sm font-semibold text-foreground">{addr || "—"}</p>
      <dl className="mt-2 space-y-1 text-[12px] text-muted-foreground">
        <div className="flex gap-2">
          <dt className="w-28 shrink-0">County</dt>
          <dd className="font-medium text-foreground">{form.county}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0">Owner of record</dt>
          <dd className="font-medium text-foreground">
            {form.owner || (form.ownerFromDeed ? "Per deed of record" : "—")}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0">Property type</dt>
          <dd className="font-medium text-foreground">
            {form.singleFamily ? "Residential" : "Other"}
          </dd>
        </div>
        {form.parcel && (
          <div className="flex gap-2">
            <dt className="w-28 shrink-0">Parcel #</dt>
            <dd className="font-medium text-foreground">{form.parcel}</dd>
          </div>
        )}
        {form.legalDescription && (
          <div className="flex gap-2">
            <dt className="w-28 shrink-0">Legal (short)</dt>
            <dd className="font-medium text-foreground">{form.legalDescription}</dd>
          </div>
        )}
      </dl>
      {form.dataProvider && (
        <p className="mt-2 text-[11px] text-muted-foreground">Source: {form.dataProvider}</p>
      )}
    </div>
  );
}

export function IntakeForm({
  state,
  form,
  set,
  parcelUsed,
  lookupStatus,
  lookupLoading,
  lookupResults,
  onUseParcel,
  onLookup,
  onSelectParcel,
  onClear,
  onInvalidateParcel,
  onBuild,
  onExit,
}: {
  state: StateInfo;
  form: DeedForm;
  set: <K extends keyof DeedForm>(k: K, v: DeedForm[K]) => void;
  parcelUsed: boolean;
  lookupStatus: string | null;
  lookupLoading?: boolean;
  lookupResults?: ParcelRecord[];
  onUseParcel: () => void;
  onLookup: () => void;
  onSelectParcel?: (p: ParcelRecord) => void;
  onClear: () => void;
  onInvalidateParcel: () => void;
  onBuild: () => void;
  onExit?: () => void;
}) {
  const cfg = getJurisdictionConfig(state.code);
  const intake = getIntakeProfile(state.code);
  const liveLookup = hasLiveLookup(state.code);
  const deedTypeLabels = cfg.deedTypes.map((d) => d.label);
  const granteeTypes = intake.granteeTypes ?? GRANTEE_TYPES;
  const [parcelError, setParcelError] = useState<string | null>(null);

  const setParcelField = <K extends keyof DeedForm>(k: K, v: DeedForm[K]) => {
    set(k, v);
    onInvalidateParcel();
    setParcelError(null);
  };

  const useEnteredParcel = () => {
    if (!form.street.trim()) {
      setParcelError("Enter at least the street.");
      return;
    }
    if (cfg.manualRequiresAssessedValue && !form.marketValue.trim()) {
      setParcelError("Enter the county assessed value.");
      return;
    }
    setParcelError(null);
    set("dataProvider", "Manual entry");
    onUseParcel();
  };

  const showLiveFind =
    intake.parcelMode === "live-only" ||
    intake.parcelMode === "live-or-manual" ||
    (intake.parcelMode === "nc-live" && liveLookup);

  return (
    <div className="border border-border bg-card p-7 pb-10">
      <h2 className="font-display text-3xl text-foreground">
        {intake.pageTitle ?? `New deed file · ${state.name}`}
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {cfg.intro}
        {intake.appendRecordingNote && (
          <> Recording is at the {cfg.recordingLabel}.</>
        )}
      </p>

      {/* ── Parcel section ── */}
      <div className="mt-6 space-y-5">
        <Field label={intake.jurisdictionLabel}>
          <SearchSelect
            value={form.county}
            options={state.counties}
            onChange={(v) => setParcelField("county", v)}
            placeholder={`Search…`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="House #">
            <input
              className={inputCls}
              placeholder={intake.housePlaceholder ?? (state.code === "NJ" ? "e.g. 35" : "e.g. 100")}
              value={form.house}
              onChange={(e) => setParcelField("house", e.target.value)}
            />
          </Field>
          <Field label="Street">
            <input
              className={inputCls}
              placeholder={intake.streetPlaceholder ?? (state.code === "NJ" ? "e.g. Hillside Ave" : "e.g. Main St")}
              value={form.street}
              onChange={(e) => setParcelField("street", e.target.value)}
            />
          </Field>
        </div>

        {intake.parcelHint && (
          <p className="text-[11px] leading-snug text-muted-foreground">{intake.parcelHint}</p>
        )}

        {(intake.showCity || intake.showPropertyType) && (
          <div className="grid grid-cols-2 gap-3">
            {intake.showCity && (
              <Field label="City / town">
                <input
                  className={inputCls}
                  placeholder="e.g. Springfield"
                  value={form.city}
                  onChange={(e) => setParcelField("city", e.target.value)}
                />
              </Field>
            )}
            {intake.showPropertyType && (
              <Field label="Property type">
                <Toggle
                  options={intake.propertyTypeLabels}
                  value={form.singleFamily}
                  onChange={(v) => setParcelField("singleFamily", v)}
                />
              </Field>
            )}
          </div>
        )}

        {(intake.showOwner || intake.showParcelNumber) && (
          <div className="grid grid-cols-2 gap-3">
            {intake.showOwner && (
              <Field label="Owner (optional)">
                <input
                  className={inputCls}
                  placeholder="From deed of record"
                  value={form.owner}
                  onChange={(e) => setParcelField("owner", e.target.value)}
                />
              </Field>
            )}
            {intake.showParcelNumber && (
              <Field
                label={
                  state.code === "FL" ? "Parcel / folio # (optional)" : "Parcel # (optional)"
                }
              >
                <input
                  className={inputCls}
                  placeholder={state.code === "FL" ? "Folio" : "Parcel / account"}
                  value={form.parcel}
                  onChange={(e) => setParcelField("parcel", e.target.value)}
                />
              </Field>
            )}
          </div>
        )}

        {cfg.manualRequiresAssessedValue && (
          <Field label="County assessed value">
            <input
              className={inputCls}
              inputMode="numeric"
              placeholder="e.g. 250000"
              value={form.marketValue}
              onChange={(e) =>
                setParcelField("marketValue", e.target.value.replace(/[^0-9.]/g, ""))
              }
            />
          </Field>
        )}

        <div className="flex flex-wrap gap-3">
          {intake.showUseEnteredParcel && (
            <button
              type="button"
              onClick={useEnteredParcel}
              className="inline-flex items-center gap-2 rounded-sm border border-input bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              <Check className="h-4 w-4 text-accent" />
              Use entered parcel
            </button>
          )}
          {showLiveFind && (
            <button
              type="button"
              onClick={onLookup}
              disabled={lookupLoading}
              className="inline-flex items-center gap-2 rounded-sm border border-input bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
            >
              {lookupLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              ) : (
                <Search className="h-4 w-4 text-accent" />
              )}
              {lookupLoading && intake.parcelMode === "live-only"
                ? state.code === "NJ"
                  ? "Searching MOD-IV…"
                  : "Searching…"
                : intake.findLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-2 rounded-sm border border-input bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            {intake.clearLabel}
          </button>
        </div>

        {(parcelError || lookupStatus) && (() => {
          const message = parcelError || lookupStatus!;
          const tone = lookupNoticeTone(lookupStatus, parcelError, lookupLoading);
          return (
            <p
              className={`flex items-center gap-2 rounded-sm border px-3 py-2 text-xs ${LOOKUP_NOTICE_STYLES[tone]}`}
            >
              {tone === "loading" && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent" />}
              {tone === "success" && <Check className="h-3.5 w-3.5 shrink-0 text-success" />}
              <span>{message}</span>
            </p>
          );
        })()}

        {lookupResults && lookupResults.length > 1 && !parcelUsed && (
          <ul className="divide-y divide-border rounded-sm border border-border">
            <li className="bg-secondary/40 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
              Matches — pick the right one
            </li>
            {lookupResults.map((p) => (
              <li key={p.parcelNumber || `${p.number}|${p.street}|${p.town}`}>
                <button
                  type="button"
                  onClick={() => onSelectParcel?.(p)}
                  className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-accent/5"
                >
                  <span className="text-sm font-semibold">
                    {[p.number, p.street].filter(Boolean).join(" ")}
                    {p.town ? `, ${p.town}` : ""}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{parcelMatchSubtitle(p)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {parcelUsed && (
          <ParcelCard form={form} live={Boolean(form.dataProvider && form.dataProvider !== "Manual entry")} />
        )}

        {state.openDataUrl && intake.parcelMode === "live-only" && (
          <a
            href={state.openDataUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-accent"
          >
            {state.openDataLabel ?? "Open data source"}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* ── You provide ── */}
      <hr className="my-8 border-border" />
      <div className="space-y-5">
        <p className="text-sm font-bold text-foreground">
          You provide{" "}
          <span className="font-normal text-muted-foreground">{intake.youProvideNote}</span>
        </p>

      {intake.showDeedType ? (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Grantee (buyer) type">
            <SearchSelect
              value={form.granteeType}
              options={granteeTypes}
              onChange={(v) => set("granteeType", v)}
              placeholder="Select type"
            />
          </Field>
          <Field label="Deed type">
            <SearchSelect
              value={form.deedType}
              options={deedTypeLabels}
              onChange={(v) => set("deedType", v)}
              placeholder="Select deed"
            />
          </Field>
        </div>
      ) : (
        <div>
          <Field label="Grantee (buyer) type">
            <SearchSelect
              value={form.granteeType}
              options={granteeTypes}
              onChange={(v) => set("granteeType", v)}
              placeholder="Select type"
            />
          </Field>
        </div>
      )}

      <Field label="New grantee(s) (name)" hint={intake.granteeHint}>
        <input
          className={inputCls}
          placeholder={intake.granteeNamePlaceholder ?? "e.g. John & Jane Smith"}
          value={form.granteeName}
          onChange={(e) => set("granteeName", e.target.value)}
        />
      </Field>

      {intake.showTrusteeAddress && form.granteeType === "Estate / Trust" && (
        <Field label="Trustee address (grantee is a trust)">
          <input
            className={inputCls}
            placeholder="Trustee mailing address"
            value={form.trusteeAddress}
            onChange={(e) => set("trusteeAddress", e.target.value)}
          />
        </Field>
      )}

      <Field label="Consideration">
        <Toggle
          options={intake.considerationLabels}
          value={form.nominal}
          onChange={(v) => set("nominal", v)}
        />
      </Field>
      {!form.nominal && (
        <Field label="Sale price">
          <input
            className={inputCls}
            inputMode="numeric"
            placeholder="e.g. 750000"
            value={form.consideration}
            onChange={(e) => set("consideration", e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </Field>
      )}

      {intake.tp584 && (
        <div className="space-y-5">
          <Field label="Condition of conveyance (TP-584)">
            <select
              className={inputCls}
              value={form.conditionOfConveyance}
              onChange={(e) => set("conditionOfConveyance", e.target.value)}
            >
              {NY_TP584_CONDITIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          {form.conditionOfConveyance === "p" && (
            <Field label="Exemption category (TP-584 Part 3)">
              <select
                className={inputCls}
                value={form.exemptionCategory}
                onChange={(e) => set("exemptionCategory", e.target.value)}
              >
                {NY_TP584_EXEMPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
      )}

      {intake.grantorResidency && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Field label={intake.grantorResidency.label}>
              <Toggle
                options={[
                  intake.grantorResidency.residentLabel,
                  intake.grantorResidency.nonresidentLabel,
                ]}
                value={form.grantorIsResident}
                onChange={(v) => set("grantorIsResident", v)}
              />
            </Field>
            <Field label={intake.dateLabel}>
              <input
                type="date"
                className={inputCls}
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </Field>
          </div>
          {intake.grantorResidency.hint ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {intake.grantorResidency.hint}
            </p>
          ) : null}
        </div>
      )}

      {intake.showIt2663Gain && !form.grantorIsResident && (
        <Field label="IT-2663: is the gain reported for federal income tax?">
          <Toggle
            options={["No", "Yes"]}
            value={form.gainReported}
            onChange={(v) => set("gainReported", v)}
          />
        </Field>
      )}

      {intake.showCreditLineMortgage && (
        <div className="space-y-2">
          <Field label="Subject to a credit line mortgage? (TP-584 Schedule C)">
            <Toggle
              options={["No", "Yes"]}
              value={form.creditLineMortgage}
              onChange={(v) => set("creditLineMortgage", v)}
            />
          </Field>
          {form.creditLineMortgage && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Schedule C sub-boxes (exemption/no-tax reason) left for attorney review.
            </p>
          )}
        </div>
      )}

      {intake.njExemption && (
        <div className="space-y-5">
          <Field label="RTF exemption (Realty Transfer Fee)">
            <SearchSelect
              value={form.njExemption}
              options={NJ_EXEMPTIONS}
              onChange={(v) => set("njExemption", v)}
            />
          </Field>
          {form.njExemption === "Other exempt conveyance (describe)" && (
            <Field label="Describe exempt conveyance">
              <input
                className={inputCls}
                placeholder="Describe the exempt conveyance"
                value={form.exemptionDescribe}
                onChange={(e) => set("exemptionDescribe", e.target.value)}
              />
            </Field>
          )}
        </div>
      )}

      {!intake.grantorResidency && (
        <Field label={intake.dateLabel}>
          <input
            type="date"
            className={inputCls}
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </Field>
      )}

      {intake.showPreparedBy !== false && (
        <Field label={intake.preparedByLabel}>
          <input
            className={inputCls}
            placeholder={intake.preparedByPlaceholder}
            value={form.preparedByName}
            onChange={(e) => set("preparedByName", e.target.value)}
          />
        </Field>
      )}

      {intake.attorneyPhones ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Buyer's attorney">
              <input
                className={inputCls}
                placeholder="Name / firm"
                value={form.buyerAttorney}
                onChange={(e) => set("buyerAttorney", e.target.value)}
              />
            </Field>
            <Field label="Buyer's attorney phone">
              <input
                className={inputCls}
                placeholder="(___) ___-____"
                value={form.buyerAttorneyPhone}
                onChange={(e) => set("buyerAttorneyPhone", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Seller's attorney">
              <input
                className={inputCls}
                placeholder="Name / firm"
                value={form.sellerAttorney}
                onChange={(e) => set("sellerAttorney", e.target.value)}
              />
            </Field>
            <Field label="Seller's attorney phone">
              <input
                className={inputCls}
                placeholder="(___) ___-____"
                value={form.sellerAttorneyPhone}
                onChange={(e) => set("sellerAttorneyPhone", e.target.value)}
              />
            </Field>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Buyer's attorney">
            <input
              className={inputCls}
              placeholder="Name / firm"
              value={form.buyerAttorney}
              onChange={(e) => set("buyerAttorney", e.target.value)}
            />
          </Field>
          <Field label="Seller's attorney">
            <input
              className={inputCls}
              placeholder="Name / firm"
              value={form.sellerAttorney}
              onChange={(e) => set("sellerAttorney", e.target.value)}
            />
          </Field>
        </div>
      )}

      {cfg.extraFields.map((f) =>
        f.kind === "toggle" ? (
          <Field key={f.key} label={f.label}>
            <Toggle
              options={[f.off ?? "No", f.on ?? "Yes"]}
              value={form.mdFirstTimeBuyer}
              onChange={(v) => set("mdFirstTimeBuyer", v)}
            />
          </Field>
        ) : null,
      )}

      <Field
        label="Additional grantees (beyond the first)"
        hint={intake.additionalGranteesHint}
      >
        <textarea
          rows={3}
          className={inputCls}
          placeholder={intake.additionalGranteesPlaceholder}
          value={form.additionalGrantees}
          onChange={(e) => set("additionalGrantees", e.target.value)}
        />
      </Field>

      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <button
          type="button"
          onClick={onBuild}
          disabled={!parcelUsed}
          className="rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          Build package →
        </button>
        {!parcelUsed && (
          <span className="text-xs text-muted-foreground">{intake.parcelBlockedHint}</span>
        )}
      </div>
      </div>
    </div>
  );
}
