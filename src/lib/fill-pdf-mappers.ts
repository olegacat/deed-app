import type { DeedForm } from "@/lib/deed-form.types";
import { NJ_EXEMPTIONS } from "@/lib/intake-profiles";
import { formToNjParcel } from "@/lib/nj/forms";
import type { FillPdfRequest } from "@/lib/fill-pdf";

const NJ_EXEMPTION_CODES = [
  "none",
  "senior",
  "blind_disabled",
  "low_income",
  "new_construction",
  "no_consideration",
  "entity",
  "other",
] as const;

const GRANTEE_ENTITY: Record<string, string> = {
  Individual: "INDIVIDUAL",
  Corporation: "CORPORATION",
  Partnership: "PARTNERSHIP",
  "Estate / Trust": "ESTATE_TRUST",
  LLC: "LLC",
  Other: "OTHER",
  "Single-member LLC": "SMLLC",
  "Multi-member LLC": "MMLLC",
};

function njExemptionCode(label: string): string {
  const i = NJ_EXEMPTIONS.indexOf(label as (typeof NJ_EXEMPTIONS)[number]);
  return i >= 0 ? NJ_EXEMPTION_CODES[i]! : "none";
}

function hasConsideration(form: DeedForm): boolean {
  return !form.nominal && Number(form.consideration) > 0;
}

function considerationKind(form: DeedForm): "ACTUAL" | "NONE" {
  return hasConsideration(form) ? "ACTUAL" : "NONE";
}

function grantorResidency(form: DeedForm): "RESIDENT" | "NONRESIDENT" {
  return form.grantorIsResident ? "RESIDENT" : "NONRESIDENT";
}

function deedTypeCode(deedType: string): string {
  const t = deedType.toLowerCase();
  if (t.includes("quit")) return "QUITCLAIM";
  if (t.includes("fiduciary")) return "FIDUCIARY";
  if (t.includes("special")) return "SPECIAL_WARRANTY";
  return "WARRANTY";
}

function baseInput(form: DeedForm) {
  return {
    granteeEntity: GRANTEE_ENTITY[form.granteeType] ?? "INDIVIDUAL",
    newGrantee: form.granteeName,
    considerationKind: considerationKind(form),
    consideration: Number(form.consideration) || 0,
    buyerAttorney: form.buyerAttorney,
    buyerAttorneyPhone: form.buyerAttorneyPhone,
    sellerAttorney: form.sellerAttorney,
    sellerAttorneyPhone: form.sellerAttorneyPhone,
    preparedBy: form.preparedByName,
    additionalParties: form.additionalGrantees,
    conveyanceDate: form.date,
    deedType: deedTypeCode(form.deedType),
  };
}

function formToBaseParcel(form: DeedForm, stateCode: string) {
  const assessment = Number(form.assessmentTotal || form.marketValue || 0);
  const market = Number(form.marketValue || form.assessmentTotal || 0);
  return {
    state: stateCode,
    number: form.house,
    street: form.street,
    town: form.city,
    municipality: form.city,
    county: form.county,
    owner: form.owner,
    ownerFull: form.owner,
    propertyClass: form.propertyClassCode || form.propertyClass,
    propertyClassDesc: form.propertyClass,
    assessmentTotal: assessment,
    appraisedValue: market,
    fullMarketValue: market,
    marketValue: market,
    parcelNumber: form.parcel,
    parcelId: form.parcel,
    sbl: form.parcel,
    swis: form.schoolCode,
    block: form.block,
    lot: form.lot,
    qual: form.qual,
    deedBook: form.deedBook || null,
    deedPage: form.deedPage || null,
    deedDate: form.deedDate || null,
    acres: form.acres ? Number(form.acres) : null,
    residential: form.singleFamily,
    priorBookPage: form.deedBook && form.deedPage ? `${form.deedBook} ${form.deedPage}` : null,
    mailing: form.mailingZip ? { zip: form.mailingZip, line: "", city: "", state: "" } : undefined,
  };
}

/** Map DeedForm → payload shape expected by deed-copilot fill-forms (NJ). */
export function deedFormToNjFillPayload(form: DeedForm): FillPdfRequest {
  const parcel = formToNjParcel(form);
  const input = {
    ...baseInput(form),
    grantorResidency: grantorResidency(form),
    njExemption: njExemptionCode(form.njExemption),
    exemptionDescribe: form.exemptionDescribe,
    conditionOfConveyance:
      form.njExemption !== NJ_EXEMPTIONS[0] || !hasConsideration(form) ? "p" : "a",
  };

  return {
    input,
    parcel: {
      ...parcel,
      state: "NJ",
      town: parcel.town || parcel.municipality,
    },
  };
}

function deedFormToCtFillPayload(form: DeedForm): FillPdfRequest {
  const parcel = formToBaseParcel(form, "CT");
  return {
    input: {
      ...baseInput(form),
      grantorResidency: grantorResidency(form),
      ctExempt: !hasConsideration(form),
      exemptionDescribe: form.exemptionDescribe,
    },
    parcel,
  };
}

function deedFormToNyFillPayload(form: DeedForm, stateCode: string): FillPdfRequest {
  const parcel = formToBaseParcel(form, stateCode);
  return {
    input: {
      grantorEntity: "INDIVIDUAL",
      granteeEntity: GRANTEE_ENTITY[form.granteeType] ?? "INDIVIDUAL",
      newGrantee: form.granteeName,
      trusteeAddress: form.trusteeAddress,
      considerationKind: considerationKind(form),
      consideration: Number(form.consideration) || 0,
      grantorResidency: grantorResidency(form),
      conditionOfConveyance: form.conditionOfConveyance || "a",
      exemptionCategory: form.exemptionCategory || "d",
      gainReported: form.gainReported ? "YES" : "NO",
      creditLineMortgage: form.creditLineMortgage ? "YES" : "NO",
      buyerAttorney: form.buyerAttorney,
      buyerAttorneyPhone: form.buyerAttorneyPhone,
      sellerAttorney: form.sellerAttorney,
      sellerAttorneyPhone: form.sellerAttorneyPhone,
      additionalParties: form.additionalGrantees,
      conveyanceDate: form.date,
    },
    parcel,
  };
}

function deedFormToGenericFillPayload(form: DeedForm, stateCode: string): FillPdfRequest {
  const parcel = formToBaseParcel(form, stateCode);
  const input: Record<string, unknown> = { ...baseInput(form) };
  if (stateCode === "MD") input.mdFirstTimeBuyer = form.mdFirstTimeBuyer;
  return { input, parcel };
}

/** Route DeedForm to the fill-forms payload for any supported state. */
export function deedFormToFillPayload(stateCode: string, form: DeedForm): FillPdfRequest {
  switch (stateCode) {
    case "NJ":
      return deedFormToNjFillPayload(form);
    case "CT":
      return deedFormToCtFillPayload(form);
    case "NY":
    case "NYC":
      return deedFormToNyFillPayload(form, stateCode);
    default:
      return deedFormToGenericFillPayload(form, stateCode);
  }
}

export function fillPdfFilename(stateCode: string, form: DeedForm): string {
  const safe = (s: string) => s.replace(/[^\w.-]/g, "");
  const town = safe(form.city || form.county || "parcel");
  const id = safe(form.parcel || form.block || "draft");

  switch (stateCode) {
    case "NJ": {
      const parcel = formToNjParcel(form);
      const pin = safe(parcel.pamsPin || `${parcel.block}_${parcel.lot}` || "draft");
      return `NJ_forms_${safe(parcel.municipality || "parcel")}_${pin}.pdf`;
    }
    case "CT":
      return `CT_forms_${town}_${id}.pdf`;
    case "NY":
    case "NYC":
      return `NYS_forms_${town}_${id}.pdf`;
    default:
      return `${stateCode}_deed_${safe(form.county || "parcel")}_${id}.pdf`;
  }
}

export function njPdfFilename(parcel: ReturnType<typeof formToNjParcel>): string {
  const id = (parcel.pamsPin || `${parcel.block}_${parcel.lot}` || "draft").replace(/[^\w.-]/g, "");
  const muni = (parcel.municipality || "parcel").replace(/[^\w.-]/g, "");
  return `NJ_forms_${muni}_${id}.pdf`;
}
