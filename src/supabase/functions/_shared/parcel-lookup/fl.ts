import type { ParcelLookupInput, ParcelRecord } from "./types.ts";
import { baseStreet, dedupeByKey, esc, num, titleCase } from "./utils.ts";

const LAYER =
  "https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0";
const DATASET = "https://geodata.floridagio.gov/datasets/FGIO::florida-statewide-parcels/about";

const FL_COUNTIES: Array<[string, number]> = [
  ["Alachua", 11],
  ["Baker", 12],
  ["Bay", 13],
  ["Bradford", 14],
  ["Brevard", 15],
  ["Broward", 16],
  ["Calhoun", 17],
  ["Charlotte", 18],
  ["Citrus", 19],
  ["Clay", 20],
  ["Collier", 21],
  ["Columbia", 22],
  ["Miami-Dade", 23],
  ["DeSoto", 24],
  ["Dixie", 25],
  ["Duval", 26],
  ["Escambia", 27],
  ["Flagler", 28],
  ["Franklin", 29],
  ["Gadsden", 30],
  ["Gilchrist", 31],
  ["Glades", 32],
  ["Gulf", 33],
  ["Hamilton", 34],
  ["Hardee", 35],
  ["Hendry", 36],
  ["Hernando", 37],
  ["Highlands", 38],
  ["Hillsborough", 39],
  ["Holmes", 40],
  ["Indian River", 41],
  ["Jackson", 42],
  ["Jefferson", 43],
  ["Lafayette", 44],
  ["Lake", 45],
  ["Lee", 46],
  ["Leon", 47],
  ["Levy", 48],
  ["Liberty", 49],
  ["Madison", 50],
  ["Manatee", 51],
  ["Marion", 52],
  ["Martin", 53],
  ["Monroe", 54],
  ["Nassau", 55],
  ["Okaloosa", 56],
  ["Okeechobee", 57],
  ["Orange", 58],
  ["Osceola", 59],
  ["Palm Beach", 60],
  ["Pasco", 61],
  ["Pinellas", 62],
  ["Polk", 63],
  ["Putnam", 64],
  ["St. Johns", 65],
  ["St. Lucie", 66],
  ["Santa Rosa", 67],
  ["Sarasota", 68],
  ["Seminole", 69],
  ["Sumter", 70],
  ["Suwannee", 71],
  ["Taylor", 72],
  ["Union", 73],
  ["Volusia", 74],
  ["Wakulla", 75],
  ["Walton", 76],
  ["Washington", 77],
];

const NAME_BY_CO = Object.fromEntries(FL_COUNTIES.map(([n, c]) => [c, n]));

const DOR: Record<string, string> = {
  "000": "Vacant residential",
  "001": "Single family",
  "002": "Mobile home",
  "003": "Multi-family (<10 units)",
  "004": "Condominium",
  "005": "Cooperative",
  "006": "Retirement home",
  "007": "Boarding home",
  "008": "Multi-family (10+ units)",
  "009": "Residential common",
};

function flUseDesc(uc: string) {
  const code = String(uc || "").padStart(3, "0");
  return DOR[code] || (uc ? `DOR use ${uc}` : "—");
}

function isFLResidential(uc: string) {
  const c = String(uc || "").padStart(3, "0");
  return c >= "000" && c <= "009";
}

function splitAddr(addr: string) {
  const s = String(addr || "")
    .trim()
    .replace(/\s+/g, " ");
  const m = s.match(/^(\d+[A-Za-z-]?)\s+(.*)$/);
  return m ? { number: m[1]!, street: titleCase(m[2]!) } : { number: "", street: titleCase(s) };
}

function normalize(a: Record<string, string>): ParcelRecord {
  const { number, street } = splitAddr(a.PHY_ADDR1 || "");
  const uc = String(a.DOR_UC || "").padStart(3, "0");
  return {
    state: "FL",
    number,
    street,
    town: titleCase(a.PHY_CITY || ""),
    county: NAME_BY_CO[Number(a.CO_NO)] || String(a.CO_NO || ""),
    owner: titleCase(a.OWN_NAME || ""),
    ownerFull: titleCase(a.OWN_NAME || ""),
    propertyClass: uc,
    propertyClassDesc: flUseDesc(uc),
    residential: isFLResidential(uc),
    assessmentTotal: num(a.AV_SD) || num(a.JV),
    marketValue: num(a.JV),
    parcelNumber: String(a.PARCEL_ID || "").trim(),
    sbl: String(a.PARCEL_ID || "").trim(),
    legalDescription: null,
    deedBook: null,
    deedPage: null,
    dataProvider: "FL DOR cadastral",
    sourceUrl: DATASET,
    mailing: {
      line: `${number} ${street}`.trim(),
      city: titleCase(a.PHY_CITY || ""),
      state: "FL",
      zip: String(a.PHY_ZIPCD || "").trim(),
    },
  };
}

/** Best-effort statewide FL cadastral lookup (may timeout — prototype falls back to manual). */
export async function lookupFLParcels(input: ParcelLookupInput): Promise<ParcelRecord[]> {
  const base = baseStreet(input.street);
  if (!base) return [];

  const params = new URLSearchParams();
  params.set("where", `UPPER(PHY_ADDR1) LIKE UPPER('%${esc(base)}%')`);
  params.set(
    "outFields",
    "CO_NO,OWN_NAME,PHY_ADDR1,PHY_CITY,PHY_ZIPCD,JV,AV_SD,DOR_UC,PARCEL_ID,SALE_PRC1",
  );
  params.set("returnGeometry", "false");
  params.set("resultRecordCount", "200");
  params.set("f", "json");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  let data: { features?: Array<{ attributes: Record<string, string> }>; error?: { message?: string } };
  try {
    const res = await fetch(`${LAYER}/query?${params.toString()}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch {
    throw new Error(
      "The FL statewide cadastral is slow/unavailable for live search — use manual entry below.",
    );
  } finally {
    clearTimeout(timer);
  }

  if (data.error) {
    throw new Error("The FL statewide cadastral rejected the query — use manual entry below.");
  }

  const house = input.house ? String(input.house).trim() : "";
  const county = input.county;

  return dedupeByKey(
    (data.features || [])
      .map((f) => normalize(f.attributes))
      .filter((p) => {
        if (county && p.county !== county) return false;
        if (house && p.number !== house) return false;
        return true;
      }),
    (p) => p.parcelNumber,
  );
}
