import type { StateInfo } from "@/data/states";
import { usePackageCompute } from "@/hooks/use-package-compute";
import { deedFormToFillPayload, fillPdfFilename } from "@/lib/fill-pdf-mappers";
import { applyDocumentEdits, type DocumentEdits } from "@/lib/document-edits";
import { packageDocNames, packageFormFields } from "@/lib/package-form-fields";
import { formatUSD, type TaxResult } from "@/lib/tax";
import { useCallback, useMemo, useState } from "react";
import type { DeedForm } from "./IntakeForm";
import { NJPackageView } from "./NJPackageView";
import { Pill } from "./Chrome";
import { PackageDocPanel } from "./PackageDocPanel";
import { PackagePdfActions } from "./PackagePdfActions";

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
}: {
  state: StateInfo;
  form: DeedForm;
}) {
  if (state.code === "NJ") {
    return <NJPackageView form={form} />;
  }

  return <GenericPackageView state={state} form={form} />;
}

function useDocumentEditsState() {
  const [edits, setEdits] = useState<DocumentEdits>({});
  const setEdit = useCallback((key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  }, []);
  return { edits, setEdit };
}

function GenericPackageView({
  state,
  form,
}: {
  state: StateInfo;
  form: DeedForm;
}) {
  const { loading, result } = usePackageCompute(state.code, form);
  const tax: TaxResult =
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

  const docs = useMemo(() => packageDocNames(tax), [tax]);
  const [active, setActive] = useState("DEED");
  const { edits, setEdit } = useDocumentEditsState();
  const mergedForm = useMemo(() => applyDocumentEdits(form, edits), [form, edits]);
  const previewPayload = useMemo(
    () => deedFormToFillPayload(state.code, form, edits),
    [state.code, form, edits],
  );

  const address = [mergedForm.house, mergedForm.street].filter(Boolean).join(" ");
  const fullAddress = [address, mergedForm.city].filter(Boolean).join(", ");

  const confirmed = [
    `County / recording jurisdiction: ${mergedForm.county}`,
    `Property address: ${fullAddress || "— not entered —"}`,
    `Deed type: ${mergedForm.deedType} deed`,
    `Grantee type: ${mergedForm.granteeType}`,
    mergedForm.nominal
      ? "Consideration: nominal / gift"
      : `Consideration: ${formatUSD(Number(mergedForm.consideration || 0))}`,
    `Tax computation: ${formatUSD(tax.total)} to ${tax.authority}`,
    mergedForm.parcel ? `Parcel / folio #: ${mergedForm.parcel}` : "",
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
    !mergedForm.granteeName && "New grantee name(s)",
    !mergedForm.date && "Date of conveyance",
    !mergedForm.preparedByName && "Prepared by — name",
    !mergedForm.preparedByAddress && "Prepared by — address",
    !mergedForm.owner && "Grantor (owner of record)",
    !mergedForm.nominal && !mergedForm.consideration && "Sale price amount",
    mergedForm.granteeType.toLowerCase().includes("trust") &&
      !mergedForm.trusteeAddress &&
      "Trustee address (grantee is a trust)",
  ].filter(Boolean) as string[];

  const flags = [...tax.flags];
  if (mergedForm.deedType === "Quitclaim")
    flags.push(
      "Quitclaim deed selected — it conveys only whatever interest the grantor holds, with no title warranty. Confirm this is intended.",
    );

  const activeMeta = tax.docs.find((d) => d.name === active);
  const activeFields = packageFormFields(state.code, active, mergedForm, tax);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl text-foreground">Prepared package</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {fullAddress || "Property address not entered"} · {mergedForm.county} · {state.name}
          </p>
        </div>
        <PackagePdfActions
          buildPayload={() => deedFormToFillPayload(state.code, form, edits)}
          filename={fillPdfFilename(state.code, form)}
        />
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Computing transfer tax and required forms…</p>
      )}

      <p className="rounded-sm border-l-4 border-info bg-info/5 px-4 py-3 text-[13px] leading-relaxed text-foreground">
        <strong>Complete package (PDF)</strong> includes every document listed below — cover sheet,
        deed, transfer-tax forms, and recording data. Edit any highlighted field before downloading;
        changes are merged into the PDF payload.
      </p>

      <section>
        <h3 className="mb-3 font-display text-2xl text-foreground">Review &amp; to-do</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Column title="Confirmed" tone="live" items={confirmed} />
          <Column title="Verify against the deed" tone="beta" items={verify} />
          <Column title="You still need to provide" tone="muted" items={missing} />
          <Column title="Compliance flags" tone="danger" items={flags} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr] lg:items-start">
        <div className="space-y-3">
          <div className="space-y-2">
            {docs.map((name) => {
              const meta = tax.docs.find((d) => d.name === name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setActive(name)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm border px-3 py-2.5 text-left transition-colors ${
                    active === name
                      ? "border-accent bg-accent/5 shadow-[0_0_0_2px_rgba(46,109,164,0.13)]"
                      : "border-border bg-card hover:border-accent/40"
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-foreground">{name}</div>
                    {meta?.note && (
                      <div className="text-[11px] text-muted-foreground">{meta.note}</div>
                    )}
                  </div>
                  {meta && (
                    <Pill tone={meta.required ? "info" : "beta"}>
                      {meta.required ? "Required" : "Auto-added"}
                    </Pill>
                  )}
                </button>
              );
            })}
          </div>

          <div className="rounded-sm border border-border bg-card p-3">
            <table className="w-full text-sm">
              <tbody>
                {tax.lines.map((l) => (
                  <tr key={l.label} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-2 text-foreground">
                      {l.label}
                      <div className="text-[11px] text-muted-foreground">{l.basis}</div>
                    </td>
                    <td className="py-2 text-right tabular-nums text-foreground">
                      {formatUSD(l.amount)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 font-semibold text-foreground">Total</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-foreground">
                    {formatUSD(tax.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <PackageDocPanel
          docName={active}
          {...(activeMeta?.note ? { docNote: activeMeta.note } : {})}
          fields={activeFields}
          edits={edits}
          onEdit={setEdit}
          previewPayload={previewPayload}
        />
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Data-source honesty: tax figures are computed from{" "}
        {tax.verified
          ? `${state.name}'s published rate schedule`
          : `research-grade ${state.name} rates that are not yet verified`}
        ; recording amounts are collected by the {tax.authority}; parcel facts are best-effort from
        public open data. This package is illustrative and <strong>not recording-ready</strong>.
      </p>
    </div>
  );
}
