import type { PackageComputeRequest, PackageComputeResult } from "./types.ts";
import { calculateNJTax, determineNJDocuments } from "../nj/engine.ts";
import { buildNJReview, formToNjParcel } from "../nj/forms.ts";
import { computeTax, type TaxInput } from "../tax.ts";

/** Server-side tax + document determination. */
export function runTaxSummary(input: TaxInput) {
  return computeTax(input);
}

/** Server-side package compute — generic tax or full NJ package. */
export function runPackageCompute(req: PackageComputeRequest): PackageComputeResult {
  if (req.stateCode === "NJ") {
    const parcel = formToNjParcel(req.form);
    const docInput = {
      nominal: req.form.nominal,
      consideration: Number(req.form.consideration || 0),
      grantorIsResident: req.form.grantorIsResident,
    };
    const parcelFacts = { county: parcel.county, propertyClass: parcel.propertyClass };
    const docs = determineNJDocuments(docInput, parcelFacts);
    const tax = calculateNJTax(docInput, parcelFacts);
    const review = buildNJReview(req.form, parcel, docs, tax);
    return { kind: "nj", tax, docs, review };
  }

  const tax = computeTax({
    stateCode: req.stateCode,
    county: req.form.county,
    consideration: Number(req.form.consideration || 0),
    nominal: req.form.nominal,
    singleFamily: req.form.singleFamily,
  });
  return { kind: "generic", tax };
}
