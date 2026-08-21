import type { ParcelLookupInput, ParcelRecord } from "./types.ts";
import { esc, num, titleCase } from "./utils.ts";

const NC_PARCELS =
  "https://services.nconemap.gov/secure/rest/services/NC1Map_Parcels/FeatureServer/1";

function shape(a: Record<string, string | number>): ParcelRecord {
  const numStr = String(a.saddno || (String(a.siteadd || "").match(/^\s*(\d+)/) || [])[1] || "").trim();
  const streetPart =
    [a.saddstname, a.saddsttyp].filter(Boolean).join(" ") ||
    String(a.siteadd || "").replace(/^\s*\d+[a-z]?\s*/i, "");
  const owner = [titleCase(String(a.ownname || "")), titleCase(String(a.ownname2 || ""))]
    .filter(Boolean)
    .join(" & ");
  const val = num(a.parval);
  const use = String(a.parusedesc || "").trim();
  const residential = !/^(c|i|u|a|com|ind|agr)/i.test(use);
  const city = titleCase(String(a.scity || "")) || String(a.cntyname || "");

  return {
    state: "NC",
    number: numStr,
    street: titleCase(streetPart),
    town: city,
    county: String(a.cntyname || ""),
    owner,
    ownerFull: owner,
    propertyClass: use,
    propertyClassDesc: residential ? "Residential" : "Other",
    residential,
    assessmentTotal: val,
    marketValue: val,
    parcelNumber: String(a.parno || a.altparno || "").trim(),
    sbl: String(a.parno || "").trim(),
    legalDescription: String(a.legdecfull || "").trim() || null,
    deedBook: null,
    deedPage: null,
    dataProvider: "NC OneMap (statewide parcels)",
    mailing: {
      line: [numStr, titleCase(streetPart)].filter(Boolean).join(" "),
      city,
      state: "NC",
      zip: String(a.szip || "").trim(),
    },
  };
}

export async function lookupNCParcels(input: ParcelLookupInput): Promise<ParcelRecord[]> {
  const st = input.street.trim();
  if (!input.county) throw new Error("Pick a county first.");
  if (!st) throw new Error("Enter a street name to search.");

  const where = `cntyname='${esc(input.county)}' AND siteadd LIKE '%${esc(st).toUpperCase()}%'`;
  const params = new URLSearchParams({
    where,
    outFields:
      "ownname,ownname2,siteadd,saddno,saddstname,saddsttyp,scity,szip,cntyname,parval,parno,altparno,parusedesc,legdecfull",
    returnGeometry: "false",
    resultRecordCount: "30",
    f: "json",
  });

  const res = await fetch(`${NC_PARCELS}/query?${params.toString()}`);
  if (!res.ok) throw new Error(`NC OneMap lookup failed (HTTP ${res.status})`);
  const data = (await res.json()) as {
    error?: { message?: string };
    features?: Array<{ attributes: Record<string, string | number> }>;
  };
  if (data.error) throw new Error(data.error.message || "NC OneMap query error.");

  const out = (data.features || [])
    .map((f) => shape(f.attributes))
    .filter((p) => p.street);
  out.sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));

  if (input.house) {
    const n = input.house.trim();
    out.sort((a, b) => Number(b.number === n) - Number(a.number === n));
  }
  return out;
}
