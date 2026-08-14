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

const NJ_LABEL_TO_FORM: Record<string, (form: DeedForm, value: string) => Partial<DeedForm>> = {
  "Grantor (seller)": (f, v) => ({ owner: v }),
  "Grantee (buyer)": (f, v) => ({ granteeName: v }),
  "Seller (grantor)": (f, v) => ({ owner: v }),
  "Nonresident seller (grantor)": (f, v) => ({ owner: v }),
  "Date of deed": (f, v) => ({ date: v }),
  "Closing date": (f, v) => ({ date: v }),
  "Prepared by": (f, v) => ({ preparedByName: v }),
  "Settlement officer": (f, v) => ({ sellerAttorney: v }),
  "Property address": (f, v) => {
    const m = v.match(/^(\S+)\s+(.+)$/);
    if (m) return { house: m[1]!, street: m[2]! };
    return { street: v };
  },
};

/** Merge inline document edits back into DeedForm for PDF generation. */
export function applyDocumentEdits(form: DeedForm, edits?: DocumentEdits): DeedForm {
  if (!edits || Object.keys(edits).length === 0) return form;

  let next: DeedForm = { ...form };

  const genericMap: Array<[string, keyof DeedForm]> = [
    ["deed.date", "date"],
    ["deed.grantor", "owner"],
    ["deed.grantee", "granteeName"],
  ];

  for (const [key, field] of genericMap) {
    if (edits[key] !== undefined) next[field] = edits[key] as never;
  }

  if (edits["deed.preparedBy"] !== undefined) {
    const parts = edits["deed.preparedBy"].split(" · ");
    next.preparedByName = parts[0] ?? edits["deed.preparedBy"];
    if (parts.length > 1) next.preparedByAddress = parts.slice(1).join(" · ");
  }

  const njDeedMap: Array<[string, keyof DeedForm]> = [
    ["nj.deed.grantor", "owner"],
    ["nj.deed.grantee", "granteeName"],
    ["nj.deed.municipality", "city"],
    ["nj.deed.county", "county"],
    ["nj.deed.preparedBy", "preparedByName"],
  ];

  for (const [key, field] of njDeedMap) {
    if (edits[key] !== undefined) next[field] = edits[key] as never;
  }

  for (const [key, value] of Object.entries(edits)) {
    if (!key.startsWith("nj.form.")) continue;
    const label = key.slice("nj.form.".length);
    const patch = NJ_LABEL_TO_FORM[label]?.(next, value);
    if (patch) next = { ...next, ...patch };
  }

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
    if (key.startsWith("nj.form.")) {
      extras[key] = value;
    }
  }

  return extras;
}
