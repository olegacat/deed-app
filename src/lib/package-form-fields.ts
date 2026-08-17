import type { DeedForm } from "@/lib/deed-form.types";
import {
  genericConsiderationText,
  genericPreparedByText,
} from "@/lib/document-edits";
import { formToNjParcel, njBlockLotDisplay, njFormFields, njPriorGrantor } from "@/lib/nj/forms";
import type { NjTaxResult } from "@/lib/nj/types";
import type { TaxResult } from "@/lib/tax";
import { formatUSD } from "@/lib/tax";

export type PackageFieldRow = [label: string, value: string];

function addr(form: DeedForm) {
  return [form.house, form.street].filter(Boolean).join(" ") || "[street address]";
}

function fullAddr(form: DeedForm) {
  const a = addr(form);
  return form.city ? `${a}, ${form.city}` : a;
}

function consid(form: DeedForm) {
  return form.nominal
    ? "$0 (nominal / gift)"
    : formatUSD(Number(form.consideration || 0));
}

function docKey(name: string) {
  return name.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_");
}

export function packageFieldEditKey(docName: string, label: string) {
  return `pkg.form.${docKey(docName)}.${label}`;
}

function deedFields(stateCode: string, form: DeedForm): PackageFieldRow[] {
  const countyLabel =
    stateCode === "NYC" ? "Borough" : "County / jurisdiction";
  return [
    ["Deed type", `${form.deedType} deed`],
    ["Date of conveyance", form.date || "[date of conveyance]"],
    ["Grantor (owner of record)", form.owner || "[grantor — from deed of record]"],
    ["Grantee", form.granteeName || "[new grantee]"],
    ["Grantee entity type", form.granteeType || "[entity type]"],
    ["Consideration", genericConsiderationText(form)],
    ["Property address", fullAddr(form)],
    [countyLabel, form.county || `[${countyLabel.toLowerCase()}]`],
    ["City / town", form.city || "[city / town]"],
    ["Parcel / folio / SBL", form.parcel || "[parcel identifier]"],
    ...(form.block || form.lot
      ? [["Block / lot", [form.block, form.lot, form.qual].filter(Boolean).join(" · ") || "[block / lot]"] as PackageFieldRow]
      : []),
    ...(form.schoolCode ? [["SWIS / school code", form.schoolCode] as PackageFieldRow] : []),
    ["Prepared by", genericPreparedByText(form)],
    ["Buyer's attorney", form.buyerAttorney || "[buyer's attorney]"],
    ["Seller's attorney", form.sellerAttorney || "[seller's attorney]"],
    ["Additional grantees", form.additionalGrantees.trim() || "[none]"],
    [
      "Prior deed book & page",
      form.deedBook && form.deedPage
        ? `${form.deedBook} / ${form.deedPage}${form.deedDate ? ` (${form.deedDate})` : ""}`
        : "[prior recording reference]",
    ],
    [
      "Legal description",
      form.legalDescription.trim() ||
        "[Pending recorded-deed retrieval — paste verbatim description from last deed of record]",
    ],
  ];
}

function tp584Fields(form: DeedForm): PackageFieldRow[] {
  return [
    ["Grantor name", form.owner || "[grantor name]"],
    ["Grantor address", "[grantor mailing address]"],
    ["Grantee name", form.granteeName || "[grantee name]"],
    ["Grantee entity", form.granteeType || "[entity type]"],
    ["Property street address", addr(form)],
    ["City of property", form.city || "[city]"],
    ["County of property", form.county || "[county]"],
    ["SWIS code", form.schoolCode || "[SWIS code]"],
    ["Parcel / SBL", form.parcel || "[parcel / SBL]"],
    ["Consideration", consid(form)],
    ["Condition of conveyance (TP-584)", form.conditionOfConveyance || "a"],
    ["Exemption category (Part 3)", form.exemptionCategory || "d"],
    ["Credit line mortgage (Sch. C)", form.creditLineMortgage ? "YES" : "NO"],
    ["Conveyance date", form.date || "[date]"],
    ["Trustee address (if trust)", form.trusteeAddress || "[if applicable]"],
  ];
}

function rp5217Fields(form: DeedForm, stateCode: string): PackageFieldRow[] {
  const borough = stateCode === "NYC" ? form.county || "[borough]" : form.city || "[town]";
  return [
    ["Street number", form.house || "[number]"],
    ["Street name", form.street || "[street]"],
    ...(stateCode === "NYC"
      ? [["Borough", borough] as PackageFieldRow]
      : [["Town / city", form.city || "[town]"] as PackageFieldRow]),
    ["Zip", form.mailingZip || "[ZIP]"],
    ["Seller / grantor", form.owner || "[grantor]"],
    ["Buyer / grantee", form.granteeName || "[grantee]"],
    ["Parcel / BBL / roll ID", form.parcel || "[parcel id]"],
    ["Full sale price", consid(form)],
    ["Sale / conveyance date", form.date || "[date]"],
    ["Attorney", form.buyerAttorney || form.sellerAttorney || "[attorney]"],
    ["Attorney phone", form.buyerAttorneyPhone || form.sellerAttorneyPhone || "[phone]"],
  ];
}

function it2663Fields(form: DeedForm): PackageFieldRow[] {
  return [
    ["Transferor / seller", form.owner || "[grantor]"],
    ["Property location", fullAddr(form)],
    ["Section / block / lot", form.parcel || "[parcel id]"],
    ["Consideration", consid(form)],
    ["Conveyance date", form.date || "[date]"],
    ["Gain reported on NYS return", form.gainReported ? "YES" : "NO"],
    ["Grantor residency", form.grantorIsResident ? "NYS resident" : "Nonresident"],
  ];
}

function op236Fields(form: DeedForm): PackageFieldRow[] {
  return [
    ["Grantor", form.owner || "[grantor]"],
    ["Grantor address", "[grantor address]"],
    ["Town", form.city || "[town]"],
    ["Property location", fullAddr(form)],
    ["Consideration", consid(form)],
    ["Conveyance date", form.date || "[date]"],
    ["Prepared by / signer", form.preparedByName || form.sellerAttorney || "[signer]"],
  ];
}

function coverFields(docName: string, stateCode: string, form: DeedForm): PackageFieldRow[] {
  return [
    ["Recording office / form", docName],
    ["State", stateCode],
    ["County / jurisdiction", form.county || "[county]"],
    ["Municipality", form.city || "[municipality]"],
    ["Document type", "Deed"],
    ["Grantor", form.owner || "[grantor]"],
    ["Grantee", form.granteeName || "[grantee]"],
    ["Property", fullAddr(form)],
    ["Parcel ID", form.parcel || "[parcel]"],
    ["Consideration", consid(form)],
    ["Prepared by", genericPreparedByText(form)],
    ["Return to", form.preparedByAddress || "[return address]"],
  ];
}

function taxSummaryFields(tax: TaxResult, form: DeedForm): PackageFieldRow[] {
  const rows: PackageFieldRow[] = [
    ["Tax authority", tax.authority],
    ["Property", fullAddr(form)],
    ["Consideration basis", consid(form)],
  ];
  for (const line of tax.lines) {
    rows.push([line.label, `${formatUSD(line.amount)} — ${line.basis}`]);
  }
  rows.push(["Total transfer tax / fees", formatUSD(tax.total)]);
  return rows;
}

function matchDoc(name: string, patterns: string[]) {
  const u = name.toUpperCase();
  return patterns.some((p) => u.includes(p.toUpperCase()));
}

function njDeedFields(form: DeedForm): PackageFieldRow[] {
  const parcel = formToNjParcel(form);
  const bl = njBlockLotDisplay(parcel) || "[block / lot]";
  const hasC = !form.nominal && Number(form.consideration) > 0;
  const consid = hasC
    ? `the sum of ${formatUSD(Number(form.consideration))}`
    : "the sum of One ($1.00) Dollar and other good and valuable consideration";
  return [
    ["Grantor (per deed of record)", njPriorGrantor(parcel)],
    ["Grantee", form.granteeName || "[new grantee]"],
    ["Consideration", consid],
    ["Municipality", parcel.municipality || parcel.town || "[municipality]"],
    ["County", parcel.county || "[county]"],
    ["Block / lot / qualifier", bl],
    ["PAMS PIN", parcel.pamsPin || "[PAMS PIN]"],
    [
      "Property address",
      `${parcel.number} ${parcel.street}, ${parcel.municipality || parcel.town}, NJ`,
    ],
    [
      "Prior recording reference",
      parcel.deedBook
        ? `Deed Book ${parcel.deedBook}, Page ${parcel.deedPage}${parcel.deedDate ? ` (${parcel.deedDate})` : ""}`
        : "[prior recording reference]",
    ],
    [
      "Legal description",
      form.legalDescription.trim() ||
        "[Pending deed-of-record retrieval — attached as Schedule A]",
    ],
    ["Date of deed", form.date || "[date]"],
    [
      "Prepared by",
      form.preparedByName || form.sellerAttorney || form.buyerAttorney || "[preparer]",
    ],
    ["NJ exemption claimed", form.njExemption || "[exemption]"],
  ];
}

export function njTaxToGeneric(tax: NjTaxResult): TaxResult {
  return {
    verified: true,
    authority: "New Jersey Division of Taxation",
    lines: tax.lines.map((l) => ({ label: l.name, basis: l.basis, amount: l.amount })),
    total: tax.total,
    docs: [],
    flags: [],
    formulaCopy: "",
  };
}

/** Field rows for one document in the downloadable PDF package. */
export function packageFormFields(
  stateCode: string,
  docName: string,
  form: DeedForm,
  tax: TaxResult,
  njTax?: NjTaxResult,
): PackageFieldRow[] | null {
  const n = docName.trim();
  const upper = n.toUpperCase();

  if (stateCode === "NJ") {
    if (upper === "DEED") return njDeedFields(form);
    const parcel = formToNjParcel(form);
    const nj = njTax ?? { lines: [], total: 0 };
    const njFields = njFormFields(n, form, parcel, nj);
    if (njFields) return njFields;
  }

  if (upper === "DEED" || upper.endsWith(" DEED")) return deedFields(stateCode, form);
  if (matchDoc(n, ["TP-584"])) return tp584Fields(form);
  if (matchDoc(n, ["RP-5217"])) return rp5217Fields(form, stateCode);
  if (matchDoc(n, ["IT-2663"])) return it2663Fields(form);
  if (matchDoc(n, ["OP-236"])) return op236Fields(form);
  if (matchDoc(n, ["TAX SUMMARY", "TRANSFER TAX"])) return taxSummaryFields(tax, form);
  if (matchDoc(n, ["COVER", "CLERK", "RECORDER", "REGISTRY", "RPT", "ACRIS", "AU-263", "REET", "DEED TAX"])) {
    return coverFields(n, stateCode, form);
  }

  // Generic data page for any other doc in the package list.
  if (tax.docs.some((d) => d.name === n)) {
    return coverFields(n, stateCode, form);
  }

  return null;
}

/** All docs that should appear in the editor (DEED first, then package-compute list). */
export function packageDocNames(tax: TaxResult): string[] {
  const names = tax.docs.map((d) => d.name);
  const deedIdx = names.findIndex((n) => n.toUpperCase() === "DEED");
  if (deedIdx === -1) return ["DEED", ...names];
  const rest = names.filter((_, i) => i !== deedIdx);
  return ["DEED", ...rest];
}
