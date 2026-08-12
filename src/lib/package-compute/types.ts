import type { DeedForm } from "@/lib/deed-form.types";
import type { NjDoc, NjTaxResult, NjReview } from "@/lib/nj/types";
import type { TaxResult } from "@/lib/tax";

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
