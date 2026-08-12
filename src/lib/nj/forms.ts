import type { DeedForm } from "@/lib/deed-form.types";
import { formatUSD } from "@/lib/tax";
import type { NjTaxResult } from "./types";

export type { NjReview } from "./types";

export interface NjParcelView {
  number: string;
  street: string;
  town: string;
  municipality: string;
  county: string;
  block: string;
  lot: string;
  qual: string;
  pamsPin: string;
  propertyClass: string;
  propertyClassDesc: string;
  assessmentTotal: number;
  acres: number | null;
  deedBook: string | null;
  deedPage: string | null;
  deedDate: string | null;
  ownerFull: string;
  mailingZip: string;
}

export function formToNjParcel(form: DeedForm): NjParcelView {
  const { block, lot, qual } = resolveNjBlockLot(form.block, form.lot, form.qual, form.parcel);
  return {
    number: form.house,
    street: form.street,
    town: form.city,
    municipality: form.city,
    county: form.county,
    block,
    lot,
    qual,
    pamsPin: form.parcel,
    propertyClass: form.propertyClassCode,
    propertyClassDesc: form.propertyClass,
    assessmentTotal: Number(form.assessmentTotal || form.marketValue || 0),
    acres: form.acres ? Number(form.acres) : null,
    deedBook: form.deedBook || null,
    deedPage: form.deedPage || null,
    deedDate: form.deedDate || null,
    ownerFull: form.owner,
    mailingZip: form.mailingZip,
  };
}

/** When block/lot aren't on the form, derive them from PAMS_PIN (e.g. 0235_28_6 → 28 / 6). */
export function resolveNjBlockLot(
  block: string,
  lot: string,
  qual: string,
  pamsPin: string,
): { block: string; lot: string; qual: string } {
  if (block.trim() || lot.trim()) {
    return { block: block.trim(), lot: lot.trim(), qual: qual.trim() };
  }
  const parts = String(pamsPin || "")
    .trim()
    .split("_");
  if (parts.length >= 3) {
    return {
      block: parts[1]!.trim(),
      lot: parts.slice(2).join("_").trim(),
      qual: qual.trim(),
    };
  }
  return { block: block.trim(), lot: lot.trim(), qual: qual.trim() };
}

/** Human-readable block/lot line — never show raw PAMS_PIN here. */
export function njBlockLotDisplay(
  p: Pick<NjParcelView, "block" | "lot" | "qual" | "pamsPin">,
  opts: { sep?: string; qualLabel?: "Qual" | "Qualifier" } = {},
): string {
  const { block, lot, qual } = resolveNjBlockLot(p.block, p.lot, p.qual, p.pamsPin);
  const sep = opts.sep ?? " · ";
  const qualWord = opts.qualLabel ?? "Qual";
  return [
    block && `Block ${block}`,
    lot && `Lot ${lot}`,
    qual && `${qualWord} ${qual}`,
  ]
    .filter(Boolean)
    .join(sep);
}

export function njPriorGrantor(p: NjParcelView) {
  return p.ownerFull || "[Grantor — per deed of record]";
}

export function njMunicipalCode(p: NjParcelView) {
  return p.pamsPin ? String(p.pamsPin).split("_")[0] : "";
}

export function njDeedLines(form: DeedForm, parcel: NjParcelView) {
  const grantor = njPriorGrantor(parcel);
  const hasC = !form.nominal && Number(form.consideration) > 0;
  const consid = hasC
    ? `the sum of ${formatUSD(Number(form.consideration))}`
    : "the sum of One ($1.00) Dollar and other good and valuable consideration";
  const taxLot =
    njBlockLotDisplay(parcel, { sep: ", ", qualLabel: "Qualifier" }) || "[block / lot]";
  const priorRef = parcel.deedBook
    ? `Deed Book ${parcel.deedBook}, Page ${parcel.deedPage}${parcel.deedDate ? ` (dated ${parcel.deedDate})` : ""}`
    : "[prior recording reference — per deed of record]";
  return {
    grantor,
    grantee: form.granteeName || "[new grantee]",
    consid,
    municipality: parcel.municipality || parcel.town,
    county: parcel.county,
    taxLot,
    address: `${parcel.number} ${parcel.street}, ${parcel.municipality || parcel.town}, New Jersey${parcel.mailingZip ? ` ${parcel.mailingZip}` : ""}`,
    priorRef,
    preparedBy:
      form.preparedByName || form.sellerAttorney || form.buyerAttorney || "[Prepared by — name of preparer]",
  };
}

function njFormKey(code: string) {
  if (code.startsWith("RTF-1EE")) return "RTF-1EE";
  if (code.startsWith("RTF-1")) return "RTF-1";
  if (code.startsWith("GIT/REP-1")) return "GITREP1";
  if (code.startsWith("GIT/REP-3")) return "GITREP3";
  if (code.includes("Cover")) return "COVER";
  if (code === "RTF") return "RTF";
  return code;
}

export function njFormFields(
  code: string,
  form: DeedForm,
  parcel: NjParcelView,
  tax: NjTaxResult,
): Array<[string, string]> | null {
  const grantor = njPriorGrantor(parcel);
  const hasC = !form.nominal && Number(form.consideration) > 0;
  const considText = hasC ? formatUSD(Number(form.consideration)) : "$0 (no / nominal consideration)";
  const bl = njBlockLotDisplay(parcel) || "—";
  const rtfLine = tax.lines.find((l) => l.name.includes("Realty Transfer Fee"));
  const gpLine = tax.lines.find((l) => l.name.includes("Graduated"));

  const builders: Record<string, () => Array<[string, string]>> = {
    RTF: () => [
      ["Realty Transfer Fee (seller)", rtfLine ? formatUSD(rtfLine.amount) : formatUSD(0)],
      ["Basis", rtfLine ? rtfLine.basis : "No consideration"],
      ["Paid", "At recording, by the grantor (seller)."],
    ],
    "RTF-1": () => [
      ["County / Municipality", `${parcel.county} · ${parcel.municipality || parcel.town}`],
      ["County-municipal code", njMunicipalCode(parcel)],
      ["Block / Lot", bl],
      ["Property address", `${parcel.number} ${parcel.street}`],
      ["Grantor (seller)", grantor],
      ["Consideration", considText],
      ["Total assessed valuation", parcel.assessmentTotal ? formatUSD(parcel.assessmentTotal) : "—"],
      ["Exemption claimed", form.njExemption],
      ["Date of deed", form.date || "[date]"],
      ["Settlement officer", form.sellerAttorney || form.buyerAttorney || "[deponent]"],
    ],
    "RTF-1EE": () => [
      ["County / Municipality", `${parcel.county} · ${parcel.municipality || parcel.town}`],
      ["County-municipal code", njMunicipalCode(parcel)],
      ["Block / Lot", bl],
      ["Property address", `${parcel.number} ${parcel.street}`],
      ["Property class", `${parcel.propertyClass} — ${parcel.propertyClassDesc}`],
      ["Consideration", considText],
      ["Total assessed valuation", parcel.assessmentTotal ? formatUSD(parcel.assessmentTotal) : "—"],
      [
        "Graduated Percent Fee (seller)",
        gpLine ? `${formatUSD(gpLine.amount)} — ${gpLine.basis}` : "Not triggered (≤ $1M)",
      ],
      ["Grantor (seller)", grantor],
      ["Date of deed", form.date || "[date]"],
    ],
    GITREP3: () => [
      ["Seller (grantor)", grantor],
      ["Property", `${parcel.number} ${parcel.street}, ${parcel.municipality || parcel.town}`],
      ["Block / Lot / Qual", bl],
      ["Seller %/ownership", "100%"],
      ["Total consideration", considText],
      ["Closing date", form.date || "[date]"],
      [
        "Assurance",
        "Resident seller (or exemption) — Seller's Residency Certification. Box 1 (NJ resident) marked; attorney confirms.",
      ],
    ],
    GITREP1: () => [
      ["Nonresident seller (grantor)", grantor],
      ["Property", `${parcel.number} ${parcel.street}, ${parcel.municipality || parcel.town}`],
      ["Block / Lot / Qual", bl],
      ["Total consideration", considText],
      ["Seller's share", considText],
      ["Closing date", form.date || "[date]"],
      ["Estimated GIT payment", "Requires gain/basis — attorney computes (2% of consideration minimum)."],
    ],
    COVER: () => [
      ["County", `${parcel.county} County, New Jersey`],
      ["Municipality", parcel.municipality || parcel.town],
      ["Block / Lot / Qualifier", bl],
      ["Document type", "Deed"],
      ["Grantor (seller)", grantor],
      ["Grantee (buyer)", form.granteeName || "[new grantee]"],
      ["Property", `${parcel.number} ${parcel.street}`],
      ["Consideration", considText],
      ["Prepared by", form.preparedByName || form.sellerAttorney || form.buyerAttorney || "[preparer]"],
      ["Return to", "[preparer / return address]"],
    ],
  };

  const fn = builders[njFormKey(code)];
  return fn ? fn() : null;
}
