import type { ParcelLookupInput, ParcelRecord } from "./types.ts";
import { baseStreet, dedupeByKey, esc, num, titleCase } from "./utils.ts";

const PHILA_SQL = "https://phl.carto.com/api/v2/sql";
const PHILA_COLS =
  "location,parcel_number,owner_1,owner_2,market_value,taxable_land,taxable_building,category_code_description,building_code_description,zip_code,sale_price,zoning";
const PHILA_DATASET = "https://opendataphilly.org/datasets/philadelphia-properties-and-assessment-history/";

const WPRDC = "https://data.wprdc.org/api/3/action/datastore_search_sql";
const WPRDC_RID = "65855e14-549e-4992-b5be-d629afc676fa";
const ALLEGHENY_DATASET = "https://data.wprdc.org/dataset/property-assessments";

function splitLoc(loc: string) {
  const s = String(loc || "")
    .trim()
    .replace(/\s+/g, " ");
  const m = s.match(/^(\d+[A-Za-z-]?)\s+(.*)$/);
  return m ? { number: m[1]!, street: titleCase(m[2]!) } : { number: "", street: titleCase(s) };
}

function normalizePhila(r: Record<string, string>): ParcelRecord {
  const { number, street } = splitLoc(r.location || "");
  const market = num(r.market_value);
  const taxable = num(r.taxable_land) + num(r.taxable_building);
  return {
    state: "PA",
    number,
    street,
    town: "Philadelphia",
    county: "Philadelphia",
    owner: titleCase(r.owner_1 || ""),
    ownerFull: [titleCase(r.owner_1 || ""), titleCase(r.owner_2 || "")].filter(Boolean).join(" & "),
    propertyClass: r.category_code_description || "",
    propertyClassDesc:
      [r.category_code_description, r.building_code_description].filter(Boolean).join(" · ") || "—",
    residential: /single family|multi family|residential|apartment|condo|row/i.test(
      r.category_code_description || "",
    ),
    assessmentTotal: taxable || market,
    marketValue: market,
    parcelNumber: r.parcel_number || "",
    sbl: r.parcel_number || "",
    legalDescription: null,
    deedBook: null,
    deedPage: null,
    dataProvider: "Philadelphia OPA",
    sourceUrl: PHILA_DATASET,
    mailing: {
      line: [number, street].filter(Boolean).join(" "),
      city: "Philadelphia",
      state: "PA",
      zip: String(r.zip_code || "").trim(),
    },
  };
}

function normalizeAllegheny(r: Record<string, string>): ParcelRecord {
  const number = String(r.PROPERTYHOUSENUM || "").replace(/^0+(?=\d)/, "");
  const street = titleCase(r.PROPERTYADDRESS || "");
  const assessed = num(r.FAIRMARKETTOTAL);
  return {
    state: "PA",
    number,
    street,
    town: titleCase(r.MUNIDESC || ""),
    county: "Allegheny",
    owner: "",
    ownerFull: "",
    ownerFromDeed: true,
    propertyClass: r.CLASSDESC || "",
    propertyClassDesc:
      [r.CLASSDESC, r.USEDESC].filter(Boolean).map(titleCase).join(" · ") || "—",
    residential: /residential|single|multi|condo|apartment/i.test(
      `${r.CLASSDESC || ""} ${r.USEDESC || ""}`,
    ),
    assessmentTotal: assessed,
    marketValue: 0,
    parcelNumber: String(r.PARID || "").trim(),
    sbl: String(r.PARID || "").trim(),
    legalDescription: null,
    deedBook: null,
    deedPage: null,
    schoolDistrict: r.SCHOOLDESC || "",
    dataProvider: "Allegheny County (WPRDC)",
    sourceUrl: ALLEGHENY_DATASET,
    mailing: {
      line: [number, street].filter(Boolean).join(" "),
      city: titleCase(r.PROPERTYCITY || ""),
      state: "PA",
      zip: String(r.PROPERTYZIP || "").trim(),
    },
  };
}

async function lookupPhiladelphia(input: ParcelLookupInput): Promise<ParcelRecord[]> {
  const clauses: string[] = [];
  const base = baseStreet(input.street, true);
  if (base) clauses.push(`UPPER(location) LIKE UPPER('%${esc(base)}%')`);
  if (input.house) clauses.push(`location LIKE '${esc(String(input.house).trim())} %'`);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const q = `SELECT ${PHILA_COLS} FROM opa_properties_public ${where} LIMIT 40`;
  const res = await fetch(`${PHILA_SQL}?q=${encodeURIComponent(q)}&format=json`);
  if (!res.ok) throw new Error(`Live Philadelphia OPA lookup failed (HTTP ${res.status})`);
  const data = (await res.json()) as { error?: unknown; rows?: Record<string, string>[] };
  if (data.error) {
    throw new Error(`Philadelphia OPA: ${JSON.stringify(data.error).slice(0, 140)}`);
  }
  return dedupeByKey(
    (data.rows || []).map(normalizePhila),
    (p) => p.parcelNumber,
  );
}

async function lookupAllegheny(input: ParcelLookupInput): Promise<ParcelRecord[]> {
  const base = baseStreet(input.street, true);
  const clauses: string[] = [];
  if (base) clauses.push(`"PROPERTYADDRESS" ILIKE '%${esc(base)}%'`);
  if (input.house) clauses.push(`"PROPERTYHOUSENUM" = '${esc(String(input.house).trim())}'`);
  const cols =
    '"PARID","PROPERTYHOUSENUM","PROPERTYADDRESS","PROPERTYCITY","PROPERTYZIP","MUNIDESC","SCHOOLDESC","CLASSDESC","USEDESC","FAIRMARKETTOTAL","SALEPRICE"';
  const sql = `SELECT ${cols} FROM "${WPRDC_RID}" ${clauses.length ? "WHERE " + clauses.join(" AND ") : ""} LIMIT 40`;
  const res = await fetch(`${WPRDC}?sql=${encodeURIComponent(sql)}`);
  if (!res.ok) throw new Error(`Live Allegheny (WPRDC) lookup failed (HTTP ${res.status})`);
  const data = (await res.json()) as {
    success?: boolean;
    error?: unknown;
    result?: { records?: Record<string, string>[] };
  };
  if (!data.success) {
    throw new Error(`Allegheny WPRDC: ${JSON.stringify(data.error || "query error").slice(0, 140)}`);
  }
  return dedupeByKey(
    (data.result?.records || []).map(normalizeAllegheny),
    (p) => p.parcelNumber,
  );
}

const PA_LIVE: Record<string, (input: ParcelLookupInput) => Promise<ParcelRecord[]>> = {
  Philadelphia: lookupPhiladelphia,
  Allegheny: lookupAllegheny,
};

export function isPALiveCounty(county: string): boolean {
  return county in PA_LIVE;
}

export async function lookupPAParcels(input: ParcelLookupInput): Promise<ParcelRecord[]> {
  const fn = PA_LIVE[input.county];
  if (!fn) {
    throw new Error(`No live parcel connector for ${input.county} County yet — use manual entry.`);
  }
  const out = await fn(input);
  if (input.house) {
    const n = String(input.house).trim();
    out.sort((a, b) => (b.number === n ? 1 : 0) - (a.number === n ? 1 : 0));
  }
  return out;
}
