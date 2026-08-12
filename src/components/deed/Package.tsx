import type { StateInfo } from "@/data/states";
import { usePackageCompute } from "@/hooks/use-package-compute";
import { downloadPackagePdf } from "@/lib/fill-pdf";
import { deedFormToFillPayload, fillPdfFilename } from "@/lib/fill-pdf-mappers";
import { formatUSD } from "@/lib/tax";
import { useState } from "react";
import type { DeedForm } from "./IntakeForm";
import { NJPackageView } from "./NJPackageView";
import { Pill } from "./Chrome";

const SINGULAR: Record<string, string> = {
  counties: "County",
  parishes: "Parish",
  boroughs: "Borough",
  towns: "Town",
  registries: "Registry of Deeds",
  jurisdictions: "jurisdiction",
  wards: "Ward",
};

function Column({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "live" | "beta" | "muted" | "danger";
  items: string[];
}) {
  const bar: Record<string, string> = {
    live: "border-t-success",
    beta: "border-t-warning",
    muted: "border-t-border",
    danger: "border-t-destructive",
  };
  return (
    <div className={`rounded-lg border border-border border-t-4 bg-card p-4 ${bar[tone]}`}>
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <Pill tone={tone}>{String(items.length)}</Pill>
      </div>
      <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
        {items.length === 0 && <li>Nothing here.</li>}
        {items.map((t) => (
          <li key={t}>• {t}</li>
        ))}
      </ul>
    </div>
  );
}

export function PackageView({
  state,
  form,
  onRestart,
}: {
  state: StateInfo;
  form: DeedForm;
  onRestart: () => void;
}) {
  if (state.code === "NJ") {
    return <NJPackageView form={form} onRestart={onRestart} />;
  }

  return <GenericPackageView state={state} form={form} onRestart={onRestart} />;
}

function GenericPackageView({
  state,
  form,
  onRestart,
}: {
  state: StateInfo;
  form: DeedForm;
  onRestart: () => void;
}) {
  const { loading, result } = usePackageCompute(state.code, form);
  const tax =
    result?.kind === "generic"
      ? result.tax
      : {
          verified: false,
          authority: `${state.name} recording authority`,
          lines: [],
          total: 0,
          docs: [{ name: "DEED", required: true }],
          flags: [],
          formulaCopy: "",
        };

  const address = [form.house, form.street].filter(Boolean).join(" ");
  const fullAddress = [address, form.city].filter(Boolean).join(", ");

  const confirmed = [
    `County / recording jurisdiction: ${form.county}`,
    `Property address: ${fullAddress || "— not entered —"}`,
    `Deed type: ${form.deedType} deed`,
    `Grantee type: ${form.granteeType}`,
    form.nominal
      ? "Consideration: nominal / gift"
      : `Consideration: ${formatUSD(Number(form.consideration || 0))}`,
    `Tax computation: ${formatUSD(tax.total)} to ${tax.authority}`,
    form.parcel ? `Parcel / folio #: ${form.parcel}` : "",
  ].filter(Boolean) as string[];

  const verify = [
    "Owner / vesting exactly as it reads on the last deed of record (including middle initials and 'as tenants by the entirety' language).",
    "Full legal description — copy verbatim from the prior recorded instrument, including metes and bounds or lot/block.",
    "Prior deed book & page / instrument number for the derivation clause.",
    state.code === "FL"
      ? "Homestead status — a Florida homestead conveyance may require both spouses to join in the deed."
      : state.code === "NY" || state.code === "NYC"
        ? "Whether the property is subject to a credit line mortgage (TP-584 Schedule C)."
        : `Any ${state.name}-specific marital, homestead or curtesy joinder requirement.`,
  ];

  const missing = [
    !form.granteeName && "New grantee name(s)",
    !form.date && "Date of conveyance",
    !form.preparedByName && "Prepared by — name",
    !form.preparedByAddress && "Prepared by — address",
    !form.owner && "Grantor (owner of record)",
    !form.nominal && !form.consideration && "Sale price amount",
  ].filter(Boolean) as string[];

  const flags = [...tax.flags];
  if (form.deedType === "Quitclaim")
    flags.push(
      "Quitclaim deed selected — it conveys only whatever interest the grantor holds, with no title warranty. Confirm this is intended.",
    );

  const [busyPdf, setBusyPdf] = useState(false);
  const [pdfMsg, setPdfMsg] = useState<string | null>(null);

  async function dlPdf() {
    setBusyPdf(true);
    setPdfMsg(null);
    try {
      const payload = deedFormToFillPayload(state.code, form);
      await downloadPackagePdf(payload, fillPdfFilename(state.code, form));
    } catch (e) {
      setPdfMsg(e instanceof Error ? e.message : "PDF generation failed.");
    } finally {
      setBusyPdf(false);
    }
  }

  const doPrint = () => window.print();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl text-foreground">Prepared package</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {fullAddress || "Property address not entered"} · {form.county} · {state.name}
          </p>
        </div>
        <div className="no-print flex gap-3">
          <button
            type="button"
            onClick={dlPdf}
            disabled={busyPdf}
            className="cursor-pointer rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-70"
          >
            {busyPdf ? "Building…" : "⬇ Complete package (PDF)"}
          </button>
          <button
            type="button"
            onClick={doPrint}
            className="cursor-pointer rounded-sm border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
          >
            ⤓ Print
          </button>
        </div>
      </div>

      {pdfMsg && (
        <p className="rounded-sm border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-warning">
          {pdfMsg}
        </p>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">Computing transfer tax and required forms…</p>
      )}

      <div className="rounded-lg border-l-4 border-info bg-info/5 p-4 text-[13px] leading-relaxed text-foreground">
        The bundle contains a cover sheet + review checklist, the {form.deedType.toLowerCase()} deed
        itself, a tax computation and recording-data page, and a one-page tax summary.{" "}
        {tax.docs.length > 1 && (
          <>
            {state.recordingQuirk ??
              `Confirm the ${state.name} recording office's own cover-sheet and form requirements before submission.`}
          </>
        )}
      </div>

      <section>
        <h3 className="mb-3 font-display text-2xl text-foreground">Review &amp; to-do</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Column title="Confirmed" tone="live" items={confirmed} />
          <Column title="Verify against the deed" tone="beta" items={verify} />
          <Column title="You still need to provide" tone="muted" items={missing} />
          <Column title="Compliance flags" tone="danger" items={flags} />
        </div>
      </section>

      <section className="border border-border bg-card p-7">
        <h3 className="font-display text-2xl text-foreground">Documents in this package</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {tax.docs.map((d) => (
            <span
              key={d.name}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground"
            >
              {d.name}
              <Pill tone={d.required ? "info" : "beta"}>
                {d.required ? "Required" : "Auto-added"}
              </Pill>
            </span>
          ))}
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 font-semibold">Item</th>
              <th className="py-2 font-semibold">Basis</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {tax.lines.map((l) => (
              <tr key={l.label} className="border-b border-border/60">
                <td className="py-2 text-foreground">{l.label}</td>
                <td className="py-2 text-muted-foreground">{l.basis}</td>
                <td className="py-2 text-right tabular-nums text-foreground">
                  {formatUSD(l.amount)}
                </td>
              </tr>
            ))}
            <tr>
              <td className="py-2 font-bold text-foreground" colSpan={2}>
                Total due to {tax.authority}
              </td>
              <td className="py-2 text-right font-bold tabular-nums text-foreground">
                {formatUSD(tax.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="relative overflow-hidden rounded-sm border border-border bg-card p-10 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-[110px] font-bold uppercase tracking-widest text-muted-foreground/10"
        >
          Draft
        </div>
        <div className="relative font-serif-doc text-[15px] leading-8 text-foreground">
          <p className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Draft — not for recording
          </p>
          <h3 className="mt-4 text-center text-2xl font-bold uppercase tracking-wide">
            {form.deedType} Deed
          </h3>
          <p className="mt-6">
            THIS INDENTURE, made the{" "}
            <Placeholder>{form.date || "[date of conveyance]"}</Placeholder>, between{" "}
            <Placeholder>{form.owner || "[grantor — from deed of record]"}</Placeholder>, grantor,
            and <Placeholder>{form.granteeName || "[new grantee]"}</Placeholder>
            {form.granteeType !== "Individual" ? `, a ${form.granteeType.toLowerCase()},` : ""}{" "}
            grantee.
          </p>
          <p className="mt-4">
            WITNESSETH, that the grantor, in consideration of{" "}
            <Placeholder>
              {form.nominal
                ? "ten dollars ($10.00) and other good and valuable consideration"
                : formatUSD(Number(form.consideration || 0))}
            </Placeholder>
            , does hereby grant and convey unto the grantee all that certain plot, piece or parcel
            of land situate in {form.city || "[city / town]"}, {form.county}{" "}
            {SINGULAR[state.countyLabel] ?? "County"}, {state.name}
            {form.parcel ? `, known as parcel ${form.parcel}` : ""}, described as follows:
          </p>
          <p className="mt-4 rounded-sm border border-warning/50 bg-warning/10 px-4 py-3 text-[13px] leading-relaxed">
            [LEGAL DESCRIPTION] — carried on the prior recorded instrument for this parcel.{" "}
            <strong>[Pending recorded-deed retrieval]</strong> — paste the verbatim description from
            the last deed of record before this draft is used.
          </p>
          {form.additionalGrantees.trim() && (
            <p className="mt-4">
              Additional grantees (see attachment page):{" "}
              {form.additionalGrantees
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
                .join("; ")}
            </p>
          )}
          <p className="mt-6">
            IN WITNESS WHEREOF, the grantor has executed this deed the day and year first above
            written.
          </p>
          <p className="mt-10 border-t border-border pt-2 text-sm">
            ____________________________
            <br />
            <Placeholder>{form.owner || "[grantor — from deed of record]"}</Placeholder>
          </p>
          <p className="mt-8 text-[13px] text-muted-foreground">
            Prepared by:{" "}
            <Placeholder>
              {form.preparedByName || form.preparedByAddress
                ? `${form.preparedByName} · ${form.preparedByAddress}`
                : "[Prepared by — name & address]"}
            </Placeholder>
            {form.buyerAttorney && <> · Buyer's attorney: {form.buyerAttorney}</>}
            {form.sellerAttorney && <> · Seller's attorney: {form.sellerAttorney}</>}
          </p>
        </div>
      </section>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Data-source honesty: tax figures are computed from{" "}
        {tax.verified
          ? `${state.name}'s published rate schedule`
          : `research-grade ${state.name} rates that are not yet verified`}
        ; recording amounts are collected by the {tax.authority}; parcel facts are best-effort from
        public open data and owner / legal description come from the recorded instrument. This
        package is illustrative and <strong>not recording-ready</strong> — attorney and title review
        is required.
      </p>

      <button
        onClick={onRestart}
        className="no-print rounded-sm border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
      >
        ↺ Start over / change inputs
      </button>
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[0.95em] text-foreground">
      {children}
    </span>
  );
}