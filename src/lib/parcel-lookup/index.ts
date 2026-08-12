import { invokeEdgeFunction } from "@/lib/supabase-edge";
import type { ParcelLookupInput, ParcelRecord } from "./types";

export type { ParcelLookupInput, ParcelRecord } from "./types";

/** States with a working live parcel connector (matches deed-copilot-prototype). */
export const LIVE_LOOKUP_STATES = new Set(["NY", "NYC", "NJ", "CT", "NC", "PA", "FL"]);

export function hasLiveLookup(stateCode: string): boolean {
  return LIVE_LOOKUP_STATES.has(stateCode);
}

/** Client wrapper — Supabase Edge Function `parcel-lookup`. */
export async function lookupParcels(input: ParcelLookupInput): Promise<ParcelRecord[]> {
  return invokeEdgeFunction<ParcelRecord[]>("parcel-lookup", input as Record<string, unknown>);
}

/** Apply a parcel record onto deed form fields. */
export function parcelToFormFields(p: ParcelRecord) {
  const pin = p.parcelNumber || "";
  let block = p.block || "";
  let lot = p.lot || "";
  if (!block && !lot && pin.includes("_")) {
    const parts = pin.split("_");
    if (parts.length >= 3) {
      block = parts[1]!.trim();
      lot = parts.slice(2).join("_").trim();
    }
  }
  return {
    house: p.number,
    street: p.street,
    city: p.town,
    county: p.county,
    owner: p.ownerFull || p.owner,
    parcel: pin || p.sbl,
    block,
    lot,
    qual: p.qual || "",
    propertyClass: p.propertyClassDesc,
    propertyClassCode: p.propertyClass,
    assessmentTotal: p.assessmentTotal > 0 ? String(p.assessmentTotal) : "",
    acres: p.acres != null ? String(p.acres) : "",
    mailingZip: p.mailing?.zip || "",
    deedDate: p.deedDate || "",
    marketValue:
      p.marketValue > 0
        ? String(p.marketValue)
        : p.assessmentTotal > 0
          ? String(p.assessmentTotal)
          : "",
    singleFamily: p.residential,
    deedBook: p.deedBook || "",
    deedPage: p.deedPage || "",
    schoolDistrict: p.schoolDistrict || "",
    schoolCode: p.schoolCode || "",
    legalDescription: p.legalDescription || "",
    dataProvider: p.dataProvider,
    parcelSourceUrl: p.sourceUrl || "",
    ownerFromDeed: p.ownerFromDeed ?? false,
  };
}
