import type { ParcelLookupInput, ParcelRecord } from "./types.ts";
import { baseStreet, dedupeByKey, esc, num } from "./utils.ts";

const BASE = "https://data.ny.gov/resource/7vem-aaz7.json";

function normalize(r: Record<string, string>): ParcelRecord {
  const owner = [r.primary_owner_first_name, r.primary_owner_mi, r.primary_owner_last_name]
    .filter(Boolean)
    .join(" ");
  const owner2 = [r.additional_owner_1_first, r.additional_owner_1_last_name].filter(Boolean).join(" ");
  const ownerFull = [owner, owner2].filter(Boolean).join(" and ");
  const classDesc = r.property_class_description || "";
  const residential = /resid|single|two family|three family|condo|dwelling/i.test(classDesc);

  return {
    state: "NY",
    number: r.parcel_address_number || "",
    street: [r.parcel_address_street, r.parcel_address_suff].filter(Boolean).join(" "),
    town: r.municipality_name || "",
    county: r.county_name || "",
    owner,
    ownerFull,
    propertyClass: r.property_class || "",
    propertyClassDesc: classDesc || "—",
    residential,
    assessmentTotal: num(r.assessment_total),
    marketValue: num(r.full_market_value),
    parcelNumber: r.print_key_code || "",
    sbl: r.print_key_code || "",
    legalDescription: null,
    deedBook: r.deed_book || null,
    deedPage: r.page || null,
    schoolDistrict: r.school_district_name || undefined,
    schoolCode: r.school_district_code || undefined,
    dataProvider: "data.ny.gov · assessment roll (7vem-aaz7)",
    mailing: {
      line: [r.mailing_address_number, r.mailing_address_street, r.mailing_address_suff]
        .filter(Boolean)
        .join(" "),
      city: r.mailing_address_city || "",
      state: r.mailing_address_state || "",
      zip: r.mailing_address_zip || "",
    },
  };
}

export async function lookupNYParcels(input: ParcelLookupInput): Promise<ParcelRecord[]> {
  const params = new URLSearchParams();
  params.set("county_name", input.county);
  if (input.city) params.set("municipality_name", input.city);
  if (input.house) params.set("parcel_address_number", input.house.trim());
  const base = baseStreet(input.street);
  if (base) params.set("$where", `upper(parcel_address_street) like upper('%${esc(base)}%')`);
  params.set("$order", "roll_year DESC");
  params.set("$limit", "40");

  const res = await fetch(`${BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`NY assessment lookup failed (HTTP ${res.status})`);
  const rows = (await res.json()) as Record<string, string>[];

  const parcels = dedupeByKey(
    rows.map(normalize),
    (p) => `${p.sbl}|${p.number}|${p.street}`,
  ).map((p) => ({
    ...p,
    sourceUrl: `${BASE}?county_name=${encodeURIComponent(input.county)}&print_key_code=${encodeURIComponent(p.sbl)}`,
  }));

  if (input.house) {
    const n = input.house.trim();
    parcels.sort((a, b) => Number(b.number === n) - Number(a.number === n));
  }
  return parcels;
}
