import type { ParcelLookupInput, ParcelRecord } from "./types.ts";
import { baseStreet, dedupeByKey, esc, num, splitAddress, titleCase } from "./utils.ts";

const LAYER =
  "https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/Parcels_Composite_NJ_WM/FeatureServer/0";

const NJ_CLASS: Record<string, string> = {
  "1": "Vacant land",
  "2": "Residential (≤4 units)",
  "3A": "Farm (regular)",
  "4A": "Commercial",
  "4C": "Apartment (5+ units)",
};

function classDesc(pc: string) {
  return NJ_CLASS[String(pc || "").toUpperCase().trim()] || (pc ? `Class ${pc}` : "—");
}

function isResidential(pc: string) {
  return ["2", "3A"].includes(String(pc || "").toUpperCase().trim());
}

function normalize(a: Record<string, string>): ParcelRecord {
  const { number, street } = splitAddress(a.PROP_LOC || "");
  const block = String(a.PCLBLOCK || "").trim();
  const lot = String(a.PCLLOT || "").trim();
  const qual = String(a.PCLQCODE || "").trim();
  const pc = String(a.PROP_CLASS || "").trim();

  const acres = num(a.CALC_ACRE) > 0 ? +num(a.CALC_ACRE).toFixed(2) : undefined;

  return {
    state: "NJ",
    number,
    street,
    town: titleCase(a.MUN_NAME || ""),
    county: titleCase(a.COUNTY || ""),
    owner: "",
    ownerFull: "",
    ownerFromDeed: true,
    propertyClass: pc,
    propertyClassDesc: classDesc(pc),
    residential: isResidential(pc),
    assessmentTotal: num(a.NET_VALUE),
    marketValue: 0,
    parcelNumber: String(a.PAMS_PIN || "").trim(),
    block,
    lot,
    qual,
    sbl:
      [block && `Block ${block}`, lot && `Lot ${lot}`, qual && `Qual ${qual}`]
        .filter(Boolean)
        .join(", ") || String(a.PAMS_PIN || ""),
    legalDescription: null,
    deedBook: a.DEED_BOOK || null,
    deedPage: a.DEED_PAGE || null,
    deedDate: a.DEED_DATE || null,
    acres,
    dataProvider: "NJGIN · MOD-IV Composite (owner not on public layer)",
    mailing: {
      line: String(a.ST_ADDRESS || "").trim(),
      city: titleCase(a.MUN_NAME || ""),
      state: "NJ",
      zip: String(a.ZIP_CODE || a.ZIP5 || "").trim(),
    },
  };
}

export async function lookupNJParcels(input: ParcelLookupInput): Promise<ParcelRecord[]> {
  const clauses = [`COUNTY='${esc(String(input.county).toUpperCase())}'`];
  const base = baseStreet(input.street);
  if (base) clauses.push(`UPPER(PROP_LOC) LIKE UPPER('%${esc(base)}%')`);
  if (input.house) clauses.push(`PROP_LOC LIKE '${esc(input.house.trim())} %'`);

  const params = new URLSearchParams();
  params.set("where", clauses.join(" AND "));
  params.set(
    "outFields",
    "PAMS_PIN,COUNTY,MUN_NAME,PROP_LOC,PROP_CLASS,PCLBLOCK,PCLLOT,PCLQCODE,NET_VALUE,DEED_BOOK,DEED_PAGE,DEED_DATE,CALC_ACRE,ST_ADDRESS,ZIP_CODE",
  );
  params.set("returnGeometry", "false");
  params.set("resultRecordCount", "40");
  params.set("f", "json");

  const res = await fetch(`${LAYER}/query?${params.toString()}`);
  if (!res.ok) throw new Error(`NJ MOD-IV lookup failed (HTTP ${res.status})`);
  const data = (await res.json()) as {
    error?: { message?: string };
    features?: Array<{ attributes: Record<string, string> }>;
  };
  if (data.error) throw new Error(data.error.message || "NJ MOD-IV query error.");

  const parcels = dedupeByKey(
    (data.features || []).map((f) => normalize(f.attributes)),
    (p) => p.parcelNumber || `${p.number}|${p.street}|${p.town}`,
  ).map((p) => ({
    ...p,
    sourceUrl: "https://njgin.nj.gov/njgin/edata/parcels/index.html",
  }));

  if (input.house) {
    const n = input.house.trim();
    parcels.sort((a, b) => Number(b.number === n) - Number(a.number === n));
  }
  return parcels;
}
