/** Per-jurisdiction intake + sidebar copy (ported from deed-copilot-prototype). */

export interface DeedTypeOption {
  value: string;
  label: string;
}

export interface ExtraField {
  key: string;
  label: string;
  kind: "toggle" | "text";
  on?: string;
  off?: string;
  placeholder?: string;
}

export interface JurisdictionConfig {
  intro: string;
  recordingLabel: string;
  engineNote: string;
  liveNote: string;
  deedTypes: DeedTypeOption[];
  defaultDeedType: string;
  extraFields: ExtraField[];
  /** NC-style live street search (separate from address lookup). */
  ncLiveStreetLookup?: boolean;
  /** PA requires assessed value for manual parcel. */
  manualRequiresAssessedValue?: boolean;
}

const ENTITY_DEED_TYPES_DEFAULT: DeedTypeOption[] = [
  { value: "Warranty", label: "Warranty Deed" },
  { value: "Quitclaim", label: "Quitclaim Deed" },
];

export const JURISDICTION_CONFIG: Record<string, JurisdictionConfig> = {
  NY: {
    intro: "Enter the address. Parcel data is pulled live from the NY State assessment roll.",
    recordingLabel: "county Clerk",
    engineNote:
      "Transfer-tax engine — NYS 0.4% + local RPTT, mansion tax tiers, IT-2663 for non-resident grantors. County forms auto-selected.",
    liveNote: "Live assessment roll (data.ny.gov) — owner, SBL, school district, class, assessed value, prior deed book/page.",
    deedTypes: [
      { value: "Warranty", label: "Warranty Deed" },
      { value: "Special Warranty", label: "Special Warranty Deed" },
      { value: "Quitclaim", label: "Quitclaim Deed" },
    ],
    defaultDeedType: "Warranty",
    extraFields: [],
  },
  NYC: {
    intro: "Enter the address. Parcel data is pulled live from NYC Open Data PLUTO (BBL + owner).",
    recordingLabel: "ACRIS / borough office",
    engineNote:
      "NYC RPTT + NYS transfer + mansion schedule (1.0–3.9% residential ≥ $1M). TP-584 + RP-5217NYC + NYC-RPT via ACRIS.",
    liveNote: "NYC PLUTO — BBL, owner, building class, assessed + estimated market value.",
    deedTypes: [
      { value: "Warranty", label: "Warranty Deed" },
      { value: "Quitclaim", label: "Quitclaim Deed" },
    ],
    defaultDeedType: "Warranty",
    extraFields: [],
  },
  NJ: {
    intro: "Enter the address. Parcel data is pulled live from the statewide MOD-IV composite.",
    recordingLabel: "county recording office",
    engineNote:
      "RTF graduated schedule + 2025 seller-paid graduated fee. RTF-1/1EE and GIT/REP routing by consideration and residency.",
    liveNote:
      "MOD-IV live parcel data (location, block/lot, values) — owner name is not on the public layer; grantor comes from the deed.",
    deedTypes: [
      { value: "Warranty", label: "Warranty Deed" },
      { value: "Quitclaim", label: "Quitclaim Deed" },
    ],
    defaultDeedType: "Warranty",
    extraFields: [],
  },
  CT: {
    intro: "Enter the parcel. The conveyance tax + the deed generate from what you provide.",
    recordingLabel: "town clerk",
    engineNote:
      "State tiered conveyance tax (0.75% / 1.25% / 2.25%) + municipal rate by town. OP-236 filed with the town clerk.",
    liveNote:
      "Statewide parcel + CAMA live data — owner, appraised value, prior deed book/page, parcel ID.",
    deedTypes: [
      { value: "Warranty", label: "Warranty Deed" },
      { value: "Quitclaim", label: "Quitclaim Deed" },
      { value: "Fiduciary", label: "Fiduciary Deed" },
    ],
    defaultDeedType: "Warranty",
    extraFields: [],
  },
  PA: {
    intro: "Enter the parcel. The transfer tax + the deed generate from what you provide.",
    recordingLabel: "county Recorder of Deeds",
    engineNote:
      "State 1% CLR + local rates (Philadelphia 3.278%, Pittsburgh 5%). REV-183 when consideration is not stated or is a gift.",
    liveNote:
      "Philadelphia + Allegheny have live parcel data; other 65 counties — enter parcel manually with assessed value.",
    deedTypes: [
      { value: "Warranty", label: "Warranty Deed" },
      { value: "Quitclaim", label: "Quitclaim Deed" },
    ],
    defaultDeedType: "Warranty",
    extraFields: [],
    manualRequiresAssessedValue: true,
  },
  FL: {
    intro: "Enter the parcel. The doc-stamp tax + the deed generate from what you provide.",
    recordingLabel: "Clerk of Court",
    engineNote:
      "Doc stamp 0.70% statewide; Miami-Dade 0.60% + 0.45% surtax on single-family. No state transfer form.",
    liveNote:
      "Manual-first — optional live DOR cadastral lookup (best-effort; can timeout). Owner + folio from deed or lookup.",
    deedTypes: [
      { value: "Warranty", label: "Warranty Deed" },
      { value: "Special Warranty", label: "Special Warranty Deed" },
      { value: "Quitclaim", label: "Quitclaim Deed" },
    ],
    defaultDeedType: "Warranty",
    extraFields: [],
  },
  MA: {
    intro: "Enter the parcel. The deeds excise tax + the deed generate from what you provide.",
    recordingLabel: "county Registry of Deeds",
    engineNote:
      "Deeds excise $2.28/$500 (0.456%) statewide; Barnstable $3.24/$500 (0.648%); Nantucket & Dukes add 2% land-bank fee.",
    liveNote:
      "MassGIS has statewide parcels but not via a clean browser API — enter the parcel manually; owner comes from the deed.",
    deedTypes: [
      { value: "Warranty", label: "Warranty Deed" },
      { value: "Quitclaim", label: "Quitclaim Deed" },
    ],
    defaultDeedType: "Warranty",
    extraFields: [],
  },
  MD: {
    intro: "Enter the parcel. The transfer + recordation tax + the deed generate from what you provide.",
    recordingLabel: "Circuit Court Clerk",
    engineNote:
      "State transfer 0.5% (0.25% first-time buyer) + county transfer (0%–1.5%) + recordation. Baltimore City steps 1.0%→1.5% above $1M.",
    liveNote:
      "Maryland SDAT parcels omit owner on the public layer — enter the parcel manually; owner comes from the deed.",
    deedTypes: [
      { value: "Special Warranty", label: "Special Warranty Deed" },
      { value: "General Warranty", label: "General Warranty Deed" },
      { value: "Quitclaim", label: "Quitclaim Deed" },
    ],
    defaultDeedType: "Special Warranty",
    extraFields: [
      {
        key: "mdFirstTimeBuyer",
        label: "First-time Maryland homebuyer? (state transfer 0.25%)",
        kind: "toggle",
        on: "Yes",
        off: "No",
      },
    ],
  },
  WA: {
    intro: "Enter the parcel. The real estate excise tax + the deed generate from what you provide.",
    recordingLabel: "county Auditor / Recorder",
    engineNote:
      "Graduated REET engine — state 1.10% / 1.28% / 2.75% / 3.00% by price bracket + ~0.50% local. Brackets verified against the current DOR schedule.",
    liveNote:
      "Washington law restricts owner name + values on public parcel APIs — enter the parcel manually; owner comes from the deed.",
    deedTypes: [
      { value: "Statutory Warranty", label: "Statutory Warranty Deed" },
      { value: "Bargain and Sale", label: "Bargain and Sale Deed" },
      { value: "Quitclaim", label: "Quitclaim Deed" },
    ],
    defaultDeedType: "Statutory Warranty",
    extraFields: [],
  },
  MN: {
    intro: "Enter the parcel. The deed tax + the deed generate from what you provide.",
    recordingLabel: "County Recorder",
    engineNote:
      "Deed tax 0.33% of consideration ($1.65/$500), $1.65 minimum; Hennepin & Ramsey add 0.01% ERF (0.34% total).",
    liveNote:
      "Minnesota statewide open-parcel layer isn't performant for interactive lookup — enter the parcel manually; owner comes from the deed.",
    deedTypes: [
      { value: "Warranty", label: "Warranty Deed" },
      { value: "Quitclaim", label: "Quitclaim Deed" },
      { value: "Contract for Deed", label: "Contract for Deed" },
    ],
    defaultDeedType: "Warranty",
    extraFields: [],
  },
  NC: {
    intro: "Enter the parcel. The excise tax + the deed generate from what you provide.",
    recordingLabel: "county Register of Deeds",
    engineNote:
      "Excise tax $1.00/$500 (0.20%) statewide; seven coastal counties add 1% local land-transfer tax.",
    liveNote:
      "Live parcels from NC OneMap — owner, value, parcel # and legal description. Confirm vesting against the recorded deed.",
    deedTypes: [
      { value: "General Warranty", label: "General Warranty Deed" },
      { value: "Special Warranty", label: "Special Warranty Deed" },
      { value: "Quitclaim", label: "Quitclaim Deed" },
      { value: "Non-Warranty", label: "Non-Warranty Deed" },
    ],
    defaultDeedType: "General Warranty",
    extraFields: [],
    ncLiveStreetLookup: true,
  },
};

const DEFAULT_CONFIG: JurisdictionConfig = {
  intro: "Enter the parcel. The transfer tax + the deed generate from what you provide.",
  recordingLabel: "county recording office",
  engineNote: "Research-grade transfer-tax engine for this jurisdiction.",
  liveNote: "No live parcel connector — enter the parcel manually; owner comes from the deed of record.",
  deedTypes: ENTITY_DEED_TYPES_DEFAULT,
  defaultDeedType: "Warranty",
  extraFields: [],
};

export function getJurisdictionConfig(stateCode: string): JurisdictionConfig {
  return JURISDICTION_CONFIG[stateCode] ?? DEFAULT_CONFIG;
}

export function isNYExtendedFlow(stateCode: string): boolean {
  return stateCode === "NY";
}

export function wizardSteps(stateCode: string) {
  if (isNYExtendedFlow(stateCode)) {
    return [
      { label: "Intake", note: "Property, parties, consideration" },
      { label: "Find & extract", note: "Live parcel, roll, documents" },
      { label: "Review evidence", note: "Every value traced to a source" },
      { label: "Package", note: "Tax summary, forms, draft deed" },
    ];
  }
  return [
    { label: "Intake", note: "Property, parties, consideration" },
    { label: "Package", note: "Tax summary, forms, draft deed" },
  ];
}
