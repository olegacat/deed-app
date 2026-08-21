import type { DeedForm } from "@/lib/deed-form.types";
import { getJurisdictionConfig } from "@/lib/jurisdiction-config";
import { getIntakeProfile } from "@/lib/intake-profiles";
import { parcelToFormFields, type ParcelRecord } from "@/lib/parcel-lookup";

export type IntakeMockResult = {
  form: Partial<DeedForm>;
  statusMessage: string;
};

/** Typical closing date ~4 weeks out (YYYY-MM-DD). */
function demoClosingDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 28);
  return d.toISOString().slice(0, 10);
}

function demoParcelNy(county: string): ParcelRecord {
  return {
    state: "NY",
    number: "26",
    street: "North Dr",
    town: "Scarsdale",
    county: county || "Westchester",
    owner: "HENDERSON ROBERT J",
    ownerFull: "HENDERSON, ROBERT J & MARY A",
    propertyClass: "210",
    propertyClassDesc: "One Family Year-Round Residence",
    residential: true,
    assessmentTotal: 985_000,
    marketValue: 1_425_000,
    parcelNumber: "1234567890001000",
    sbl: "1234567890001000",
    legalDescription:
      "ALL THAT CERTAIN plot, piece or parcel of land situate in the Town of Scarsdale, County of Westchester, being known as Lot 100 on Map No. 1234.",
    deedBook: "28456",
    deedPage: "892",
    deedDate: "2018-06-14",
    schoolDistrict: "Scarsdale Union Free School District",
    schoolCode: "562302",
    dataProvider: "NY State Assessment Roll (demo)",
    sourceUrl: "https://data.ny.gov",
  };
}

function demoParcelNj(county: string): ParcelRecord {
  return {
    state: "NJ",
    number: "35",
    street: "Hillside Ave",
    town: "Tenafly",
    county: county || "Bergen",
    owner: "",
    ownerFull: "",
    ownerFromDeed: true,
    propertyClass: "2",
    propertyClassDesc: "Residential — 1 family",
    residential: true,
    assessmentTotal: 742_500,
    marketValue: 742_500,
    parcelNumber: "0201_12_0001",
    block: "12",
    lot: "1",
    qual: "C",
    sbl: "Block 12 Lot 1",
    legalDescription: "Lot 1, Block 12, as shown on the Tax Map of the Borough of Tenafly.",
    deedBook: null,
    deedPage: null,
    dataProvider: "NJ MOD-IV composite (demo)",
  };
}

function demoParcelCt(county: string): ParcelRecord {
  return {
    state: "CT",
    number: "88",
    street: "Post Rd",
    town: "Fairfield",
    county: county || "Fairfield",
    owner: "MARTINEZ, ELENA & DAVID",
    ownerFull: "MARTINEZ, ELENA & DAVID",
    propertyClass: "101",
    propertyClassDesc: "Single Family",
    residential: true,
    assessmentTotal: 528_000,
    marketValue: 528_000,
    parcelNumber: "FA-12345",
    sbl: "FA-12345",
    legalDescription: "Parcel FA-12345 on the Fairfield tax map.",
    deedBook: "4120",
    deedPage: "156",
    dataProvider: "CT CAMA (demo)",
  };
}

function demoParcelFl(county: string): ParcelRecord {
  return {
    state: "FL",
    number: "1840",
    street: "Ocean Dr",
    town: "Miami Beach",
    county: county || "Miami-Dade",
    owner: "CORAL BREEZE HOLDINGS LLC",
    ownerFull: "CORAL BREEZE HOLDINGS LLC",
    propertyClass: "0100",
    propertyClassDesc: "Single Family Residential",
    residential: true,
    assessmentTotal: 1_875_000,
    marketValue: 2_150_000,
    parcelNumber: "01-4134-001-0010",
    sbl: "01-4134-001-0010",
    legalDescription: "CORAL BREEZE SUB PB 45-82 LOT 10 BLK 1",
    deedBook: "31204",
    deedPage: "441",
    dataProvider: "FL parcel layer (demo)",
  };
}

function granteeBlock(stateCode: string): Partial<DeedForm> {
  const intake = getIntakeProfile(stateCode);
  const cfg = getJurisdictionConfig(stateCode);
  const closing = demoClosingDate();

  const base: Partial<DeedForm> = {
    granteeType: stateCode === "NY" || stateCode === "NJ" ? "Estate / Trust" : "Individual",
    deedType: cfg.defaultDeedType,
    granteeName:
      stateCode === "NY" || stateCode === "NJ"
        ? "The Henderson Family Revocable Trust dated March 12, 2019"
        : "James & Catherine Whitmore",
    trusteeAddress:
      stateCode === "NY"
        ? "26 North Dr, Scarsdale, NY 10583"
        : stateCode === "NJ"
          ? "35 Hillside Ave, Tenafly, NJ 07670"
          : "",
    nominal: stateCode === "NY" ? false : intake.defaultNominal,
    consideration: stateCode === "NY" ? "1250000" : intake.defaultNominal ? "" : "875000",
    date: closing,
    preparedByName: "Sarah Chen, Esq.",
    preparedByAddress: "200 Park Ave S, 14th Floor, New York, NY 10003",
    buyerAttorney: "Whitmore & Associates LLP",
    buyerAttorneyPhone: "(914) 555-0142",
    sellerAttorney: "Hartwell Reed LLP",
    sellerAttorneyPhone: "(914) 555-0198",
    additionalGrantees: "None",
    grantorIsResident: true,
    gainReported: false,
    creditLineMortgage: false,
    conditionOfConveyance: "a",
    exemptionCategory: "d",
    njExemption: "No exemption claimed (standard fee)",
    exemptionDescribe: "",
    mdFirstTimeBuyer: false,
  };

  return base;
}

function manualParcelBlock(stateCode: string, county: string): Partial<DeedForm> {
  const cfg = getJurisdictionConfig(stateCode);
  return {
    county: county || "Sample County",
    house: "100",
    street: "Main St",
    city: "Springfield",
    singleFamily: true,
    owner: "WHITMORE, JAMES A & CATHERINE M",
    parcel: stateCode === "FL" ? "12-3456-789-0001" : "R-1234-5678",
    marketValue: cfg.manualRequiresAssessedValue ? "425000" : "",
    dataProvider: "Manual entry (demo)",
    ownerFromDeed: false,
    propertyClass: "Single-family residential",
    propertyClassCode: "101",
    assessmentTotal: "425000",
    legalDescription: "Lot 14, Block 8, Maple Grove Subdivision, as recorded in Plat Book 22, Page 15.",
    deedBook: "15678",
    deedPage: "234",
  };
}

export function buildIntakeMock(stateCode: string, currentCounty: string): IntakeMockResult {
  const county = currentCounty.trim() || undefined;
  let parcelFields: Partial<DeedForm> = {};
  let statusMessage = "Demo data loaded — review before continuing.";

  switch (stateCode) {
    case "NY":
    case "NYC": {
      const parcel = demoParcelNy(county ?? "Westchester");
      parcelFields = parcelToFormFields(parcel);
      statusMessage = `Loaded demo parcel — ${parcel.number} ${parcel.street}, ${parcel.town} (${parcel.county} Co.).`;
      break;
    }
    case "NJ": {
      const parcel = demoParcelNj(county ?? "Bergen");
      parcelFields = parcelToFormFields(parcel);
      statusMessage = `Loaded demo parcel — ${parcel.number} ${parcel.street}, ${parcel.town} (${parcel.county} Co., NJ).`;
      break;
    }
    case "CT": {
      const parcel = demoParcelCt(county ?? "Fairfield");
      parcelFields = parcelToFormFields(parcel);
      statusMessage = `Loaded demo parcel — ${parcel.number} ${parcel.street}, ${parcel.town}.`;
      break;
    }
    case "FL": {
      const parcel = demoParcelFl(county ?? "Miami-Dade");
      parcelFields = parcelToFormFields(parcel);
      statusMessage = `Loaded demo parcel — ${parcel.number} ${parcel.street}, ${parcel.town}.`;
      break;
    }
    case "NC":
    case "PA": {
      parcelFields = {
        ...manualParcelBlock(stateCode, county ?? "Wake"),
        house: "412",
        street: "Oberlin Rd",
        city: "Raleigh",
        county: county ?? "Wake",
        owner: "PARKER, WILLIAM H",
        parcel: "171234567890",
        marketValue: "615000",
        dataProvider: "Live lookup (demo)",
      };
      statusMessage = "Loaded demo parcel — 412 Oberlin Rd, Raleigh.";
      break;
    }
    default:
      parcelFields = manualParcelBlock(stateCode, county ?? "Sample County");
      statusMessage = "Loaded demo parcel — 100 Main St, Springfield.";
  }

  return {
    form: { ...parcelFields, ...granteeBlock(stateCode) },
    statusMessage,
  };
}
