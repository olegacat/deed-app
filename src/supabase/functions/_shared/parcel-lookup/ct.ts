import type { ParcelLookupInput, ParcelRecord } from "./types.ts";
import { baseStreet, dedupeByKey, esc, num, titleCase } from "./utils.ts";

const LAYER =
  "https://services3.arcgis.com/3FL1kr7L4LvwA2Kb/arcgis/rest/services/Connecticut_State_Parcel_Layer_2023/FeatureServer/0";

function splitLoc(loc: string) {
  const s = String(loc || "")
    .trim()
    .replace(/\s+/g, " ");
  const m = s.match(/^(.*?)\s+(\d+[A-Za-z-]?)$/);
  if (m) return { street: titleCase(m[1]!), number: String(m[2]!).replace(/^0+(?=\d)/, "") };
  return { street: titleCase(s), number: "" };
}

function isResidential(useDesc: string) {
  return /resid|single family|two family|three family|condo|dwelling|apartment/i.test(useDesc);
}

function normalize(a: Record<string, string>): ParcelRecord {
  const { number, street } = splitLoc(a.Location || "");
  const appraised = num(a.Appraised_Land) + num(a.Appraised_Building);
  const useDesc = a.State_Use_Description || "";

  return {
    state: "CT",
    number,
    street,
    town: titleCase(a.Town_Name || ""),
    county: titleCase(a.Town_Name || ""),
    owner: titleCase(a.Owner || ""),
    ownerFull: [titleCase(a.Owner || ""), titleCase(a.Co_Owner || "")].filter(Boolean).join(" & "),
    propertyClass: a.State_Use || "",
    propertyClassDesc: useDesc || "—",
    residential: isResidential(useDesc),
    assessmentTotal: num(a.Assessed_Total),
    marketValue: appraised,
    parcelNumber: a.Link || "",
    sbl: a.Link || "",
    legalDescription: null,
    deedBook: a.Prior_Book_Page ? String(a.Prior_Book_Page).split(/\s+/)[0] ?? null : null,
    deedPage: a.Prior_Book_Page ? String(a.Prior_Book_Page).split(/\s+/)[1] ?? null : null,
    dataProvider: "CT Geodata · Parcel + CAMA",
    mailing: {
      line: titleCase(a.Mailing_Address || ""),
      city: titleCase(a.Mailing_City || ""),
      state: a.Mailing_State || "CT",
      zip: "",
    },
  };
}

export async function lookupCTParcels(input: ParcelLookupInput): Promise<ParcelRecord[]> {
  const town = input.city || input.county;
  const clauses = [`Town_Name='${esc(String(town).toUpperCase())}'`];
  const base = baseStreet(input.street);
  if (base) clauses.push(`UPPER(Location) LIKE UPPER('%${esc(base)}%')`);

  const params = new URLSearchParams();
  params.set("where", clauses.join(" AND "));
  params.set(
    "outFields",
    "Town_Name,Owner,Co_Owner,Location,Mailing_Address,Mailing_City,Mailing_State,Assessed_Total,Appraised_Land,Appraised_Building,State_Use,State_Use_Description,Link,Prior_Book_Page",
  );
  params.set("returnGeometry", "false");
  params.set("resultRecordCount", "40");
  params.set("f", "json");

  const res = await fetch(`${LAYER}/query?${params.toString()}`);
  if (!res.ok) throw new Error(`CT parcel lookup failed (HTTP ${res.status})`);
  const data = (await res.json()) as {
    error?: { message?: string };
    features?: Array<{ attributes: Record<string, string> }>;
  };
  if (data.error) throw new Error(data.error.message || "CT parcel query error.");

  const parcels = dedupeByKey(
    (data.features || []).map((f) => normalize(f.attributes)),
    (p) => p.parcelNumber || `${p.number}|${p.street}|${p.town}`,
  ).map((p) => ({
    ...p,
    sourceUrl: "https://geodata.ct.gov/pages/parcels",
  }));

  if (input.house) {
    const n = input.house.trim();
    parcels.sort((a, b) => Number(b.number === n) - Number(a.number === n));
  }
  return parcels;
}
