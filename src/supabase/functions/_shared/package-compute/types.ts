import type { DeedForm } from "../deed-form.types.ts";
import type { NjDoc, NjTaxResult } from "../nj/engine.ts";
import type { NjReview } from "../nj/forms.ts";
import type { TaxResult } from "../tax.ts";

export type PackageComputeRequest = {
  stateCode: string;
  form: DeedForm;
};

export type GenericPackageResult = {
  kind: "generic";
  tax: TaxResult;
};

export type NjPackageResult = {
  kind: "nj";
  tax: NjTaxResult;
  docs: NjDoc[];
  review: NjReview;
};

export type PackageComputeResult = GenericPackageResult | NjPackageResult;
