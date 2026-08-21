import type { ParcelLookupInput, ParcelRecord } from "./types.ts";
import { baseStreet, dedupeByKey, esc, num, splitAddress, titleCase } from "./utils.ts";

const BASE = "https://data.cityofnewyork.us/resource/64uk-42ks.json";

const NYC_BOROUGHS = [
  { code: "MN", borough: "Manhattan", county: "New York", digit: "1" },
  { code: "BX", borough: "Bronx", county: "Bronx", digit: "2" },
  { code: "BK", borough: "Brooklyn", county: "Kings", digit: "3" },
  { code: "QN", borough: "Queens", county: "Queens", digit: "4" },
  { code: "SI", borough: "Staten Island", county: "Richmond", digit: "5" },
];

const BLDG: Record<string, string> = {
  A: "One-family dwelling",
  B: "Two-family dwelling",
  C: "Walk-up apartment",
  D: "Elevator apartment",
  R: "Condominium",
  V: "Vacant land",
};

function boroByCounty(county: string) {
  return (
    NYC_BOROUGHS.find((b) => b.borough === county || b.county === county) ??
    NYC_BOROUGHS.find((b) => b.code === county) ?? { code: county, borough: county, county, digit: "" }
  );
}

function classDesc(bc: string) {
  const c = String(bc || "").toUpperCase().trim();
  if (!c) return "—";
  const prefix = BLDG[c[0]!];
  return prefix ? `${prefix} (${c})` : `Class ${c}`;
}

function isResidential(bc: string) {
  const c = String(bc || "").toUpperCase().trim();
  return c.startsWith("A") || c.startsWith("B") || c.startsWith("R");
}

function assessmentRatio(bldgclass: string) {
  const c = String(bldgclass || "").toUpperCase().trim();
  if (/^A/.test(c) || /^B/.test(c) || /^C[0-3]$/.test(c) || /^S[0-2]$/.test(c)) return 0.06;
  return 0.45;
}

function estMarketValue(assessed: number, bldgclass: string) {
  const av = assessed || 0;
  if (av <= 0) return 0;
  return Math.round(av / assessmentRatio(bldgclass) / 1000) * 1000;
}

function normalize(r: Record<string, string>): ParcelRecord {
  const b = boroByCounty(r.borough || "");
  const { number, street } = splitAddress(r.address || "");
  const block = String(r.block || "").trim();
  const lot = String(r.lot || "").trim();
  const assessed = num(r.assesstot);
  const bldg = String(r.bldgclass || "").trim();

  return {
    state: "NYC",
    number,
    street,
    town: b.borough,
    county: b.county,
    owner: titleCase(r.ownername || ""),
    ownerFull: titleCase(r.ownername || ""),
    propertyClass: bldg,
    propertyClassDesc: classDesc(bldg),
    residential: isResidential(bldg),
    assessmentTotal: assessed,
    marketValue: estMarketValue(assessed, bldg),
    parcelNumber: String(r.bbl || "").replace(/\.0+$/, ""),
    sbl: `BBL ${b.digit}-${block}-${lot}`,
    legalDescription: null,
    deedBook: null,
    deedPage: null,
    dataProvider: "NYC Open Data · PLUTO (64uk-42ks)",
    mailing: {
      line: [number, street].filter(Boolean).join(" "),
      city: b.borough,
      state: "NY",
      zip: String(r.zipcode || "").trim(),
    },
  };
}

export async function lookupNYCParcels(input: ParcelLookupInput): Promise<ParcelRecord[]> {
  const b = boroByCounty(input.county);
  const clauses = [`borough='${esc(b.code)}'`];
  const base = baseStreet(input.street, true);
  if (base) clauses.push(`upper(address) like upper('%${esc(base)}%')`);
  if (input.house) clauses.push(`address like '${esc(input.house.trim())} %'`);

  const params = new URLSearchParams();
  params.set("$where", clauses.join(" AND "));
  params.set(
    "$select",
    "borough,block,lot,bbl,address,ownername,bldgclass,landuse,schooldist,assessland,assesstot,lotarea,zipcode",
  );
  params.set("$limit", "40");

  const res = await fetch(`${BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`NYC PLUTO lookup failed (HTTP ${res.status})`);
  const rows = (await res.json()) as Record<string, string>[];

  const parcels = dedupeByKey(rows.map(normalize), (p) => p.parcelNumber).map((p) => ({
    ...p,
    sourceUrl: "https://data.cityofnewyork.us/City-Government/Primary-Land-Use-Tax-Lot-Output-PLUTO/64uk-42ks",
  }));

  if (input.house) {
    const n = input.house.trim();
    parcels.sort((a, b) => Number(b.number === n) - Number(a.number === n));
  }
  return parcels;
}
