import type { DeedForm } from "@/lib/deed-form.types";
import { formatUSD } from "@/lib/tax";

export type DocumentEdits = Record<string, string>;

export function genericConsiderationText(form: DeedForm): string {
  return form.nominal
    ? "ten dollars ($10.00) and other good and valuable consideration"
    : formatUSD(Number(form.consideration || 0));
}

export function genericPreparedByText(form: DeedForm): string {
  if (form.preparedByName || form.preparedByAddress) {
    return [form.preparedByName, form.preparedByAddress].filter(Boolean).join(" · ");
  }
  return "[Prepared by — name & address]";
}

/** Map editable field labels → DeedForm patches (shared across states/docs). */
const FIELD_LABEL_TO_FORM: Record<string, (form: DeedForm, value: string) => Partial<DeedForm>> = {
  "Date of conveyance": (_, v) => ({ date: v }),
  "Conveyance date": (_, v) => ({ date: v }),
  "Date of deed": (_, v) => ({ date: v }),
  "Closing date": (_, v) => ({ date: v }),
  "Sale / conveyance date": (_, v) => ({ date: v }),
  "Grantor (owner of record)": (_, v) => ({ owner: v }),
  "Grantor (per deed of record)": (_, v) => ({ owner: v }),
  "Grantor (seller)": (_, v) => ({ owner: v }),
  "Grantor name": (_, v) => ({ owner: v }),
  "Grantor": (_, v) => ({ owner: v }),
  "Seller / grantor": (_, v) => ({ owner: v }),
  "Seller (grantor)": (_, v) => ({ owner: v }),
  "Nonresident seller (grantor)": (_, v) => ({ owner: v }),
  "Transferor / seller": (_, v) => ({ owner: v }),
  "Grantee": (_, v) => ({ granteeName: v }),
  "Grantee name": (_, v) => ({ granteeName: v }),
  "Grantee (buyer)": (_, v) => ({ granteeName: v }),
  "Buyer / grantee": (_, v) => ({ granteeName: v }),
  "Grantee entity type": (_, v) => ({ granteeType: v }),
  "Grantee entity": (_, v) => ({ granteeType: v }),
  "City / town": (_, v) => ({ city: v }),
  "Town / city": (_, v) => ({ city: v }),
  "Town": (_, v) => ({ city: v }),
  "Municipality": (_, v) => ({ city: v }),
  "County / jurisdiction": (_, v) => ({ county: v }),
  "County of property": (_, v) => ({ county: v }),
  "County / recording jurisdiction": (_, v) => ({ county: v }),
  "Borough": (_, v) => ({ county: v }),
  "Parcel / folio / SBL": (_, v) => ({ parcel: v }),
  "Parcel / BBL / roll ID": (_, v) => ({ parcel: v }),
  "Parcel ID": (_, v) => ({ parcel: v }),
  "Parcel / SBL": (_, v) => ({ parcel: v }),
  "Section / block / lot": (_, v) => ({ parcel: v }),
  "SWIS code": (_, v) => ({ schoolCode: v }),
  "SWIS / school code": (_, v) => ({ schoolCode: v }),
  "Street number": (_, v) => ({ house: v }),
  "Street name": (_, v) => ({ street: v }),
  "Zip": (_, v) => ({ mailingZip: v }),
  "Prepared by": (_, v) => ({ preparedByName: v }),
  "Prepared by / signer": (_, v) => ({ preparedByName: v }),
  "Return to": (_, v) => ({ preparedByAddress: v }),
  "Buyer's attorney": (_, v) => ({ buyerAttorney: v }),
  "Seller's attorney": (_, v) => ({ sellerAttorney: v }),
  "Attorney": (_, v) => ({ sellerAttorney: v }),
  "Attorney phone": (_, v) => ({ sellerAttorneyPhone: v }),
  "Settlement officer": (_, v) => ({ sellerAttorney: v }),
  "Additional grantees": (_, v) => ({ additionalGrantees: v }),
  "Trustee address (if trust)": (_, v) => ({ trusteeAddress: v }),
  "Condition of conveyance (TP-584)": (_, v) => ({ conditionOfConveyance: v }),
  "Exemption category (Part 3)": (_, v) => ({ exemptionCategory: v }),
  "Credit line mortgage (Sch. C)": (_, v) => ({
    creditLineMortgage: v.toUpperCase().startsWith("Y"),
  }),
  "Gain reported on NYS return": (_, v) => ({
    gainReported: v.toUpperCase().startsWith("Y"),
  }),
  "Property address": (_, v) => {
    const m = v.match(/^(\S+)\s+(.+?)(?:,\s*(.+))?$/);
    if (!m) return { street: v };
    return {
      house: m[1]!,
      street: m[2]!,
      ...(m[3] ? { city: m[3] } : {}),
    };
  },
  "Property street address": (_, v) => {
    const m = v.match(/^(\S+)\s+(.+)$/);
    if (m) return { house: m[1]!, street: m[2]! };
    return { street: v };
  },
  "Property location": (_, v) => {
    const m = v.match(/^(\S+\s+.+?)(?:,\s*(.+))?$/);
    if (!m) return { street: v };
    const streetPart = m[1]!;
    const hm = streetPart.match(/^(\S+)\s+(.+)$/);
    if (hm) return { house: hm[1]!, street: hm[2]!, ...(m[2] ? { city: m[2] } : {}) };
    return { street: streetPart, ...(m[2] ? { city: m[2] } : {}) };
  },
  "Prior deed book & page": (_, v) => {
    const m = v.match(/^(.+?)\s*\/\s*(.+?)(?:\s*\((.+)\))?$/);
    if (!m) return {};
    return { deedBook: m[1]!.trim(), deedPage: m[2]!.trim(), ...(m[3] ? { deedDate: m[3]!.trim() } : {}) };
  },
  "Prior recording reference": (_, v) => {
    const m = v.match(/Book\s+(.+?),\s*Page\s+(.+?)(?:\s*\((.+)\))?/i);
    if (!m) return {};
    return { deedBook: m[1]!.trim(), deedPage: m[2]!.trim(), ...(m[3] ? { deedDate: m[3]!.trim() } : {}) };
  },
  "PAMS PIN": (_, v) => ({ parcel: v }),
  "Block / lot / qualifier": (_, v) => {
    const block = v.match(/Block\s+([^·,/]+)/i)?.[1]?.trim();
    const lot = v.match(/Lot\s+([^·,/]+)/i)?.[1]?.trim();
    const qual = v.match(/Qual(?:ifier)?\s+([^·,/]+)/i)?.[1]?.trim();
    return {
      ...(block ? { block } : {}),
      ...(lot ? { lot } : {}),
      ...(qual ? { qual } : {}),
    };
  },
  "NJ exemption claimed": (_, v) => ({ njExemption: v }),
  "Block / lot": (_, v) => {
    const block = v.match(/Block\s+([^·,]+)/i)?.[1]?.trim();
    const lot = v.match(/Lot\s+([^·,]+)/i)?.[1]?.trim();
    const qual = v.match(/Qual(?:ifier)?\s+([^·,]+)/i)?.[1]?.trim();
    return {
      ...(block ? { block } : {}),
      ...(lot ? { lot } : {}),
      ...(qual ? { qual } : {}),
    };
  },
};

function applyLegacyDeedKeys(next: DeedForm, edits: DocumentEdits): DeedForm {
  let form = next;
  const legacy: Array<[string, keyof DeedForm]> = [
    ["deed.date", "date"],
    ["deed.grantor", "owner"],
    ["deed.grantee", "granteeName"],
  ];
  for (const [key, field] of legacy) {
    if (edits[key] !== undefined) form = { ...form, [field]: edits[key] as never };
  }
  if (edits["deed.preparedBy"] !== undefined) {
    const parts = edits["deed.preparedBy"].split(" · ");
    form = {
      ...form,
      preparedByName: parts[0] ?? edits["deed.preparedBy"],
      ...(parts.length > 1 ? { preparedByAddress: parts.slice(1).join(" · ") } : {}),
    };
  }
  const njDeed: Array<[string, keyof DeedForm]> = [
    ["nj.deed.grantor", "owner"],
    ["nj.deed.grantee", "granteeName"],
    ["nj.deed.municipality", "city"],
    ["nj.deed.county", "county"],
    ["nj.deed.preparedBy", "preparedByName"],
  ];
  for (const [key, field] of njDeed) {
    if (edits[key] !== undefined) form = { ...form, [field]: edits[key] as never };
  }
  return form;
}

function applyFormFieldEdits(form: DeedForm, edits: DocumentEdits, prefix: string) {
  let next = form;
  for (const [key, value] of Object.entries(edits)) {
    if (!key.startsWith(prefix)) continue;
    const label = key.slice(prefix.length);
    const patch = FIELD_LABEL_TO_FORM[label]?.(next, value);
    if (patch) next = { ...next, ...patch };
  }
  return next;
}

/** Merge inline document edits back into DeedForm for PDF generation. */
export function applyDocumentEdits(form: DeedForm, edits?: DocumentEdits): DeedForm {
  if (!edits || Object.keys(edits).length === 0) return form;

  let next = applyLegacyDeedKeys({ ...form }, edits);
  next = applyFormFieldEdits(next, edits, "pkg.form.");
  next = applyFormFieldEdits(next, edits, "nj.form.");
  return next;
}

/** Extra input fields for fill-forms when display text was edited manually. */
export function documentEditInputExtras(
  edits: DocumentEdits | undefined,
): Record<string, string> {
  if (!edits) return {};
  const extras: Record<string, string> = {};

  if (edits["deed.consideration"]) extras.considerationDisplay = edits["deed.consideration"];
  if (edits["nj.deed.consid"]) extras.considerationDisplay = edits["nj.deed.consid"];
  if (edits["deed.grantor"]) extras.grantorDisplay = edits["deed.grantor"];
  if (edits["nj.deed.grantor"]) extras.grantorDisplay = edits["nj.deed.grantor"];
  if (edits["deed.preparedBy"]) extras.preparedByDisplay = edits["deed.preparedBy"];
  if (edits["nj.deed.preparedBy"]) extras.preparedByDisplay = edits["nj.deed.preparedBy"];
  if (edits["nj.deed.address"]) extras.propertyAddressDisplay = edits["nj.deed.address"];
  if (edits["nj.deed.taxLot"]) extras.taxLotDisplay = edits["nj.deed.taxLot"];
  if (edits["nj.deed.priorRef"]) extras.priorRecordingDisplay = edits["nj.deed.priorRef"];

  for (const [key, value] of Object.entries(edits)) {
    if (key.startsWith("pkg.form.") || key.startsWith("nj.form.")) {
      extras[key] = value;
    }
    if (key.startsWith("pkg.form.") && key.endsWith(".Consideration")) {
      extras.considerationDisplay = value;
    }
    if (key.startsWith("pkg.form.") && key.includes("Grantor")) {
      extras.grantorDisplay = value;
    }
  }

  return extras;
}
