import type { DeedForm } from "../deed-form.types.ts";
import { formatUSD } from "../tax.ts";
import type { NjDoc, NjTaxResult } from "./engine.ts";

export interface NjReview {
  confirmed: string[];
  verify: string[];
  provide: string[];
  flags: string[];
}

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

export function buildNJReview(
  form: DeedForm,
  parcel: NjParcelView,
  docs: NjDoc[],
  tax: NjTaxResult,
): NjReview {
  const confirmed: string[] = [];
  const verify: string[] = [];
  const provide: string[] = [];
  const flags: string[] = [];

  confirmed.push(
    `Property: ${parcel.number} ${parcel.street}, ${parcel.municipality || parcel.town}, ${parcel.county} County (live MOD-IV).`,
  );
  const bl = njBlockLotDisplay(parcel, { sep: ", ", qualLabel: "Qual" });
  if (bl) confirmed.push(`Parcel ID: ${bl} (live).`);
  if (parcel.propertyClass) {
    confirmed.push(`Property class ${parcel.propertyClass} — ${parcel.propertyClassDesc} (live).`);
  }
  if (parcel.assessmentTotal) {
    confirmed.push(`Total assessed value ${formatUSD(parcel.assessmentTotal)} (live).`);
  }
  if (parcel.acres != null) confirmed.push(`Lot size ${parcel.acres} ac (live).`);

  verify.push(
    "Grantor name + vesting: the MOD-IV layer omits the owner — pull the grantor from the last recorded deed of record.",
  );
  if (parcel.deedBook) {
    verify.push(
      `Prior deed reference on the roll: Deed Book ${parcel.deedBook}, Page ${parcel.deedPage} — confirm against the recorded deed.`,
    );
  } else {
    verify.push("Prior deed book/page not on the roll — retrieve from the county records.");
  }
  verify.push("Legal description (metes & bounds) comes from the recorded deed — not in the assessment layer.");

  if (!form.granteeName) provide.push("New grantee (buyer) name.");
  provide.push("Grantee SSN/EIN (kept out of the system) — for the GIT/REP and RTF-1EE.");
  if (!form.date) provide.push("Date of the deed / closing.");
  if (!form.preparedByName && !form.sellerAttorney && !form.buyerAttorney) {
    provide.push('"Prepared by" attestation (required on the NJ deed).');
  }
  if (form.njExemption === "Other exempt conveyance (describe)" && !form.exemptionDescribe) {
    provide.push("Describe the RTF exemption being claimed.");
  }

  const gpLine = tax.lines.find((l) => l.name.includes("Graduated"));
  if (gpLine) {
    flags.push(
      `Graduated Percent Fee ${formatUSD(gpLine.amount)} — seller-paid (P.L. 2025, eff. 7/10/2025); confirm the tier.`,
    );
  }
  if (!form.grantorIsResident) {
    flags.push(
      "Nonresident seller: GIT/REP-1 estimated Gross Income Tax payment required unless a waiver applies.",
    );
  }
  if (docs.some((d) => d.code === "RTF-1EE")) {
    flags.push("RTF-1EE (Affidavit of Consideration) required — over $1M or a commercial (Class 4) transfer.");
  }
  if (form.njExemption !== "No exemption claimed (standard fee)") {
    flags.push(`RTF exemption claimed (${form.njExemption}) — RTF-1 affidavit required; attorney to confirm.`);
  }
  flags.push(
    "RTF schedule + 2025 graduated fee are set to the current NJ Division of Taxation rates. Senior/blind/disabled/low-income partial exemptions go on RTF-1 with eligibility proof — the attorney computes the reduced fee.",
  );

  return { confirmed, verify, provide, flags };
}
