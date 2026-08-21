import { lookupCTParcels } from "./ct.ts";
import { lookupFLParcels } from "./fl.ts";
import { lookupNJParcels } from "./nj.ts";
import { lookupNCParcels } from "./nc.ts";
import { lookupNYCParcels } from "./nyc.ts";
import { lookupNYParcels } from "./ny.ts";
import { lookupPAParcels } from "./pa.ts";
import type { ParcelLookupInput, ParcelRecord } from "./types.ts";

type LookupFn = (input: ParcelLookupInput) => Promise<ParcelRecord[]>;

const LOOKUPS: Record<string, LookupFn> = {
  NY: lookupNYParcels,
  NYC: lookupNYCParcels,
  NJ: lookupNJParcels,
  CT: lookupCTParcels,
  NC: lookupNCParcels,
  PA: lookupPAParcels,
  FL: lookupFLParcels,
};

/** Server-side parcel lookup — calls public open-data APIs. */
export async function runParcelLookup(input: ParcelLookupInput): Promise<ParcelRecord[]> {
  const fn = LOOKUPS[input.stateCode];
  if (!fn) {
    throw new Error(`No live parcel connector for ${input.stateCode} — enter values manually.`);
  }
  if (!input.county && input.stateCode !== "NYC") {
    throw new Error("Pick a county first.");
  }
  if (!input.street?.trim()) {
    throw new Error("Enter a street name to search.");
  }
  return fn(input);
}
