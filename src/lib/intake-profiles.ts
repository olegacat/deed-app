/** Field visibility + labels per state — mirrors deed-copilot-prototype intake screens. */

export type ParcelMode = "live-only" | "manual" | "live-or-manual" | "nc-live";

export interface IntakeProfile {
  /** If false, intro is shown alone (no "Recording is at…" suffix). */
  appendRecordingNote: boolean;
  jurisdictionLabel: string;
  parcelHint?: string;
  parcelMode: ParcelMode;
  showCity: boolean;
  showPropertyType: boolean;
  propertyTypeLabels: [string, string];
  showOwner: boolean;
  showParcelNumber: boolean;
  showUseEnteredParcel: boolean;
  findLabel: string;
  clearLabel: string;
  parcelBlockedHint: string;
  youProvideNote: string;
  showDeedType: boolean;
  considerationLabels: [string, string];
  defaultNominal: boolean;
  dateLabel: string;
  preparedByLabel: string;
  preparedByPlaceholder: string;
  granteeHint?: string;
  grantorResidency?: {
    label: string;
    residentLabel: string;
    nonresidentLabel: string;
    hint: string;
  };
  njExemption?: boolean;
  attorneyPhones?: boolean;
  /** NY / NYC TP-584 condition + Schedule C + IT-2663 fields */
  tp584?: boolean;
  showTrusteeAddress?: boolean;
  showCreditLineMortgage?: boolean;
  showIt2663Gain?: boolean;
  showPreparedBy?: boolean;
  pageTitle?: string;
  granteeNamePlaceholder?: string;
  additionalGranteesHint?: string;
  housePlaceholder?: string;
  streetPlaceholder?: string;
  granteeTypes?: readonly string[];
  additionalGranteesPlaceholder: string;
}

const MANUAL_GENERIC: IntakeProfile = {
  appendRecordingNote: true,
  jurisdictionLabel: "County",
  parcelMode: "manual",
  showCity: true,
  showPropertyType: true,
  propertyTypeLabels: ["Residential", "Other"],
  showOwner: true,
  showParcelNumber: true,
  showUseEnteredParcel: true,
  findLabel: "Live lookup",
  clearLabel: "Clear",
  parcelBlockedHint: "Enter a parcel first.",
  youProvideNote: "— the new-grantee facts. Grantor comes from the deed of record.",
  showDeedType: true,
  considerationLabels: ["Nominal / gift", "Sale price"],
  defaultNominal: false,
  dateLabel: "Date of conveyance",
  preparedByLabel: "Prepared by",
  preparedByPlaceholder: "Name of preparer",
  additionalGranteesPlaceholder: "One additional new-owner name per line (optional)",
};

export const NJ_EXEMPTIONS = [
  "No exemption claimed (standard fee)",
  "Senior citizen (62+) — partial exemption",
  "Blind / disabled — partial exemption",
  "Low/moderate-income housing — partial exemption",
  "New construction — partial exemption",
  "No / nominal consideration (gift, $1)",
  "Between related legal entities (no cash)",
  "Other exempt conveyance (describe)",
] as const;

const PROFILES: Record<string, Partial<IntakeProfile>> = {
  NY: {
    pageTitle: "New deed file",
    appendRecordingNote: false,
    jurisdictionLabel: "County",
    parcelHint:
      "Searches the whole county — you'll pick the exact parcel (with its town) from the results.",
    parcelMode: "live-only",
    showCity: false,
    showPropertyType: false,
    showOwner: false,
    showParcelNumber: false,
    showUseEnteredParcel: false,
    findLabel: "Find parcel (live)",
    clearLabel: "Clear data",
    parcelBlockedHint: "Find a parcel first.",
    youProvideNote:
      "— the new-grantee facts the records can't tell us. Grantor info comes from the last deed of record; everything else is auto-filled from the live parcel.",
    showDeedType: false,
    considerationLabels: ["No consideration", "Sale price"],
    defaultNominal: true,
    dateLabel: "Date of conveyance",
    granteeHint: "SSN / EIN is left for manual entry (kept out of the system).",
    granteeNamePlaceholder: "e.g. The Smith Family Revocable Trust",
    granteeTypes: [
      "Individual",
      "Corporation",
      "Partnership",
      "Estate / Trust",
      "Single-member LLC",
      "Multi-member LLC",
      "Other",
    ],
    showPreparedBy: false,
    tp584: true,
    showTrusteeAddress: true,
    showCreditLineMortgage: true,
    showIt2663Gain: true,
    grantorResidency: {
      label: "Grantor residency",
      residentLabel: "NY resident",
      nonresidentLabel: "Non-resident",
      hint: "",
    },
    attorneyPhones: true,
    housePlaceholder: "e.g. 26",
    streetPlaceholder: "e.g. North Dr",
    additionalGranteesPlaceholder:
      "One additional new-owner name per line — enter “None” if not applicable",
    additionalGranteesHint:
      "One grantee per line. Grantors come from the last deed of record — only new grantees are entered here.",
  },
  NYC: {
    appendRecordingNote: false,
    jurisdictionLabel: "Borough",
    parcelMode: "live-only",
    showCity: false,
    showPropertyType: false,
    showOwner: false,
    showParcelNumber: false,
    showUseEnteredParcel: false,
    findLabel: "Find parcel (live)",
    clearLabel: "Clear data",
    parcelBlockedHint: "Find a parcel first.",
    showDeedType: false,
  },
  NJ: {
    appendRecordingNote: false,
    jurisdictionLabel: "County",
    parcelHint:
      "Searches the whole county — you'll pick the exact parcel (with its municipality) from the results.",
    parcelMode: "live-only",
    showCity: false,
    showPropertyType: false,
    showOwner: false,
    showParcelNumber: false,
    showUseEnteredParcel: false,
    findLabel: "Find parcel (live)",
    clearLabel: "Clear data",
    parcelBlockedHint: "Find a parcel first.",
    youProvideNote:
      "— the new-grantee facts the records can't tell us. The grantor comes from the last deed of record; everything else is auto-filled from the live parcel.",
    showDeedType: false,
    considerationLabels: ["No consideration", "Sale price"],
    defaultNominal: false,
    dateLabel: "Date of deed / closing",
    preparedByLabel: "Prepared by (required on the NJ deed)",
    preparedByPlaceholder: "Name of preparer (attorney/party)",
    granteeHint: "SSN / EIN is left for manual entry (kept out of the system).",
    grantorResidency: {
      label: "Seller (grantor) residency",
      residentLabel: "NJ resident",
      nonresidentLabel: "Non-resident",
      hint: "Resident → GIT/REP-3 (Residency Certification). Non-resident → GIT/REP-1 (estimated GIT payment).",
    },
    njExemption: true,
    attorneyPhones: true,
    additionalGranteesPlaceholder:
      "One additional new-owner name per line — generates an attachment page (optional)",
  },
  CT: {
    appendRecordingNote: false,
    jurisdictionLabel: "Town",
    parcelHint: "Searches the whole town — you'll pick the exact parcel from the results.",
    parcelMode: "live-only",
    showCity: false,
    showPropertyType: false,
    showOwner: false,
    showParcelNumber: false,
    showUseEnteredParcel: false,
    findLabel: "Find parcel (live)",
    clearLabel: "Clear data",
    parcelBlockedHint: "Find a parcel first.",
    youProvideNote:
      "— the new-grantee facts. The owner of record (grantor) is pulled live; everything else is auto-filled from the parcel.",
    considerationLabels: ["No consideration", "Sale price"],
    dateLabel: "Date of conveyance",
    grantorResidency: {
      label: "Grantor (seller) residency",
      residentLabel: "CT resident",
      nonresidentLabel: "Non-resident",
      hint: "Non-resident grantor → AU-263 affidavit required.",
    },
  },
  FL: {
    appendRecordingNote: true,
    jurisdictionLabel: "County (all 67)",
    parcelMode: "live-or-manual",
    showCity: true,
    showPropertyType: true,
    propertyTypeLabels: ["Single-family", "Other"],
    showOwner: true,
    showParcelNumber: true,
    showUseEnteredParcel: true,
    findLabel: "Try live lookup",
    clearLabel: "Clear",
    parcelBlockedHint: "Enter a parcel first.",
    preparedByLabel: "Prepared by (name & address)",
  },
  NC: {
    ...MANUAL_GENERIC,
    parcelMode: "nc-live",
    findLabel: "Find parcel",
    parcelBlockedHint: "Enter a parcel first.",
  },
  WA: { ...MANUAL_GENERIC },
  MA: { ...MANUAL_GENERIC },
  MD: {
    ...MANUAL_GENERIC,
    jurisdictionLabel: "County / Baltimore City",
  },
  MN: { ...MANUAL_GENERIC },
  PA: {
    ...MANUAL_GENERIC,
    parcelMode: "live-or-manual",
    findLabel: "Find parcel (live)",
    clearLabel: "Clear data",
  },
};

export function getIntakeProfile(stateCode: string): IntakeProfile {
  return { ...MANUAL_GENERIC, showPreparedBy: true, ...PROFILES[stateCode] };
}
