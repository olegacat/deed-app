import type { DeedForm } from "@/lib/deed-form.types";
import { invokeEdgeFunction } from "@/lib/supabase-edge";
import type { PackageComputeResult } from "@/lib/package-compute/types";
import type { TaxInput, TaxResult } from "@/lib/tax";

export async function fetchTaxSummary(input: TaxInput): Promise<TaxResult> {
  return invokeEdgeFunction<TaxResult>("package-compute", {
    action: "tax-summary",
    ...input,
  });
}

export async function fetchPackageCompute(
  stateCode: string,
  form: DeedForm,
): Promise<PackageComputeResult> {
  return invokeEdgeFunction<PackageComputeResult>("package-compute", {
    action: "package",
    stateCode,
    form,
  });
}
