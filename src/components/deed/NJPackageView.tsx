import { useMemo, useState } from "react";
import type { DeedForm } from "./IntakeForm";
import { Pill } from "./Chrome";
import { usePackageCompute } from "@/hooks/use-package-compute";
import type { NjDoc, NjTaxResult, NjReview } from "@/lib/nj/types";
import {
  formToNjParcel,
  njDeedLines,
  njFormFields,
} from "@/lib/nj/forms";
import { downloadPackagePdf } from "@/lib/fill-pdf";
import { deedFormToNjFillPayload, njPdfFilename } from "@/lib/fill-pdf-mappers";
import { formatUSD } from "@/lib/tax";

function Fill({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-b border-[#e8d48a] bg-[#fffbe9] px-0.5 font-semibold text-[#222]">
      {children}
    </span>
  );
}

function DeedHint({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-muted-foreground">{children}</span>;
}

function DocBadge({ status }: { status: string }) {
  if (status === "REQUIRED") return <Pill tone="info">REQUIRED</Pill>;
  if (status === "CONDITIONAL") return <Pill tone="beta">AUTO-ADDED</Pill>;
  return <Pill tone="muted">REVIEW</Pill>;
}

function ReviewPanel({ review }: { review: NjReview }) {
  const groups = [
    { key: "confirmed", title: "Confirmed (live)", items: review.confirmed, tone: "live" as const },
    { key: "verify", title: "Verify against the deed", items: review.verify, tone: "beta" as const },
    { key: "provide", title: "You still need to provide", items: review.provide, tone: "muted" as const },
    { key: "flags", title: "Compliance flags", items: review.flags, tone: "danger" as const },
  ];
  const bar: Record<string, string> = {
    live: "border-t-success",
    beta: "border-t-warning",
    muted: "border-t-border",
    danger: "border-t-destructive",
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-baseline gap-2">
        <h3 className="font-display text-xl text-foreground">Review &amp; to-do</h3>
        <span className="text-sm text-muted-foreground">
          {review.confirmed.length} confirmed · {review.verify.length} to verify ·{" "}
          {review.provide.length} to provide · {review.flags.length} flags
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {groups.map((g) => (
          <div
            key={g.key}
            className={`rounded-lg border border-border border-t-4 bg-card p-4 ${bar[g.tone]}`}
          >
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">{g.title}</h4>
              <Pill tone={g.tone}>{String(g.items.length)}</Pill>
            </div>
            <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
              {g.items.map((it, i) => (
                <li key={i}>• {it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function NJDeedDraft({ form, parcel }: { form: DeedForm; parcel: ReturnType<typeof formToNjParcel> }) {
  const d = njDeedLines(form, parcel);
  return (
    <div className="font-serif-doc px-1.5 py-2 text-[13.5px] leading-[1.7] text-[#222] [&_p]:mb-1 [&_p]:whitespace-pre-wrap">
      <div className="mb-1 text-center font-bold tracking-wide">DEED</div>
      <div className="mb-[18px] text-center font-sans text-[11.5px] text-muted-foreground">
        New Jersey · Bargain and Sale — DRAFT
      </div>
      <p>This Deed is made on the ____ day of __________, 2026,</p>
      <p>&nbsp;</p>
      <p>
        BETWEEN <Fill>{d.grantor}</Fill> <DeedHint>(Grantor — per deed of record)</DeedHint>, referred
        to as the Grantor,
      </p>
      <p>
        AND <Fill>{d.grantee}</Fill>, referred to as the Grantee.
      </p>
      <p>&nbsp;</p>
      <p>
        The Grantor grants and conveys (transfers ownership of) the property described below to the
        Grantee, for <Fill>{d.consid}</Fill>. The Grantor acknowledges receipt of this consideration.
      </p>
      <p>&nbsp;</p>
      <p>
        The property consists of the land and all buildings and structures on the land in the{" "}
        <Fill>{d.municipality}</Fill>, County of <Fill>{d.county}</Fill>, State of New Jersey,
        identified as <Fill>{d.taxLot}</Fill> on the municipal tax map.
      </p>
      <p>&nbsp;</p>
      <p>
        Commonly known as: <Fill>{d.address}</Fill>.
      </p>
      <p>&nbsp;</p>
      <p className="font-bold">
        LEGAL DESCRIPTION <DeedHint>— from the recorded deed of record:</DeedHint>
      </p>
      <p className="rounded-md bg-[#fff7e6] p-2">
        The metes-and-bounds legal description is carried on the prior recorded deed and is attached
        as Schedule A. [Pending deed-of-record retrieval.]
      </p>
      <p>&nbsp;</p>
      <p>
        BEING the same premises conveyed to the Grantor by deed recorded in <Fill>{d.priorRef}</Fill>{" "}
        in the {d.county} County Clerk&apos;s/Register&apos;s Office.
      </p>
      <p>&nbsp;</p>
      <p>
        The Grantor promises that the Grantor has done no act to encumber the property (this promise
        is called a &ldquo;covenant as to grantor&apos;s acts,&rdquo; N.J.S.A. 46:4-6).
      </p>
      <p>&nbsp;</p>
      <p>
        Prepared by: <Fill>{d.preparedBy}</Fill>
      </p>
    </div>
  );
}

function FormView({
  doc,
  form,
  parcel,
  tax,
}: {
  doc: { code: string; category: string; reason: string; source: string | null };
  form: DeedForm;
  parcel: ReturnType<typeof formToNjParcel>;
  tax: NjTaxResult;
}) {
  const fields = njFormFields(doc.code, form, parcel, tax);
  return (
    <div>
      <h3 className="font-display text-xl text-foreground">
        {doc.code}{" "}
        <span className="text-sm font-normal text-muted-foreground">· {doc.category}</span>
      </h3>
      <p className="mt-2 rounded-sm border-l-4 border-info bg-info/5 px-3 py-2 text-[13px] leading-relaxed text-foreground">
        {doc.reason}
        {doc.source && (
          <>
            {" "}
            ·{" "}
            <a href={doc.source} target="_blank" rel="noreferrer" className="text-accent underline">
              source
            </a>
          </>
        )}
      </p>
      {fields ? (
        <div className="mt-4 space-y-2 font-serif-doc text-[14px] leading-7 text-foreground">
          {fields.map(([k, v], i) => (
            <p key={i}>
              <span className="inline-block w-56 text-muted-foreground">{k}</span> <Fill>{v}</Fill>
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Generated from the same field set; field-level preview omitted in the prototype.
        </p>
      )}
    </div>
  );
}

export function NJPackageView({
  form,
  onRestart,
}: {
  form: DeedForm;
  onRestart: () => void;
}) {
  const { loading, result } = usePackageCompute("NJ", form);
  const parcel = useMemo(() => formToNjParcel(form), [form]);

  const docs: NjDoc[] = result?.kind === "nj" ? result.docs : [];
  const tax = result?.kind === "nj" ? result.tax : { lines: [], total: 0 };
  const review: NjReview =
    result?.kind === "nj"
      ? result.review
      : { confirmed: [], verify: [], provide: [], flags: [] };

  const [active, setActive] = useState("DEED");
  const [busyPdf, setBusyPdf] = useState(false);
  const [pdfMsg, setPdfMsg] = useState<string | null>(null);

  const realForms = docs
    .filter((d) => ["RTF-1", "RTF-1EE", "GIT/REP-1", "GIT/REP-3"].some((c) => d.code.startsWith(c)))
    .map((d) => d.code);

  const activeDoc = docs.find((d) => d.code === active);

  async function dlPdf() {
    setBusyPdf(true);
    setPdfMsg(null);
    try {
      const payload = deedFormToNjFillPayload(form);
      await downloadPackagePdf(payload, njPdfFilename(parcel));
    } catch (e) {
      setPdfMsg(e instanceof Error ? e.message : "PDF generation failed.");
    } finally {
      setBusyPdf(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="font-display text-4xl text-foreground">Prepared package</h2>
        <span className="text-sm text-muted-foreground">
          {parcel.number} {parcel.street}, {parcel.municipality} · {parcel.county} Co., NJ
        </span>
        <div className="no-print ml-auto flex gap-3">
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
            onClick={() => window.print()}
            className="cursor-pointer rounded-sm border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
          >
            ⤓ Print
          </button>
        </div>
      </div>

      <p className="rounded-sm border-l-4 border-info bg-info/5 px-4 py-3 text-[13px] leading-relaxed text-foreground">
        <strong>Complete package</strong> is one PDF, in filing order — cover + review checklist, the
        deed (NJ block/lot/qualifier + prepared-by), then the <strong>actual filled forms</strong>:{" "}
        {realForms.length ? realForms.join(", ") : "GIT/REP residency certification"}, plus a tax
        summary and county cover data page.
      </p>
      {pdfMsg && (
        <p className="rounded-sm border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-warning">
          {pdfMsg}
        </p>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">Computing NJ transfer fees and required forms…</p>
      )}

      <ReviewPanel review={review} />

      <div className="grid gap-4 lg:grid-cols-[300px_1fr] lg:items-start">
        <div className="space-y-3">
          <div className="space-y-2">
            {docs.map((d) => (
              <button
                key={d.code}
                type="button"
                onClick={() => setActive(d.code)}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm border px-3 py-2.5 text-left transition-colors ${
                  active === d.code
                    ? "border-accent bg-accent/5 shadow-[0_0_0_2px_rgba(46,109,164,0.13)]"
                    : "border-border bg-card hover:border-accent/40"
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-foreground">{d.code}</div>
                  <div className="text-[11px] text-muted-foreground">{d.category}</div>
                </div>
                <DocBadge status={d.status} />
              </button>
            ))}
          </div>

          <div className="rounded-sm border border-border bg-card p-3">
            <table className="w-full text-sm">
              <tbody>
                {tax.lines.map((l, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-2 text-foreground">
                      {l.name}
                      <div className="text-[11px] text-muted-foreground">{l.basis}</div>
                    </td>
                    <td className="py-2 text-right tabular-nums text-foreground">
                      {formatUSD(l.amount)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 font-semibold text-foreground">Total NJ transfer fees</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-foreground">
                    {formatUSD(tax.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground">
            The download contains the deed + every form above as one reviewable file.
          </p>
        </div>

        <div className={`rounded-sm border border-border bg-card ${active === "DEED" ? "px-1.5 py-2" : "p-6"}`}>
          {active === "DEED" ? (
            <NJDeedDraft form={form} parcel={parcel} />
          ) : activeDoc ? (
            <FormView doc={activeDoc} form={form} parcel={parcel} tax={tax} />
          ) : null}
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Live parcel/assessment data from the NJ MOD-IV composite; grantor name + legal description come
        from the recorded deed of record. Generated documents are illustrative drafts for attorney/title
        review — not legal advice, not recording-ready. RTF + graduated-fee rates match the current NJ
        Division of Taxation schedule; exemptions are flagged, never auto-concluded.
      </p>

      <button
        type="button"
        onClick={onRestart}
        className="no-print rounded-sm border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
      >
        ↺ Start over / change inputs
      </button>
    </div>
  );
}
