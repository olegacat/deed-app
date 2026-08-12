import { useEffect, useState } from "react";
import { fetchTaxSummary } from "@/lib/package-compute/client";
import type { TaxInput, TaxResult } from "@/lib/tax";

const FALLBACK: TaxResult = {
  verified: false,
  authority: "Recording authority",
  lines: [],
  total: 0,
  docs: [{ name: "DEED", required: true }],
  flags: [],
  formulaCopy: "",
};

/** Fetch tax summary from server when intake fields change. */
export function useTaxSummary(input: TaxInput): TaxResult {
  const [tax, setTax] = useState<TaxResult>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    void fetchTaxSummary(input)
      .then((result) => {
        if (!cancelled) setTax(result);
      })
      .catch(() => {
        if (!cancelled) setTax(FALLBACK);
      });
    return () => {
      cancelled = true;
    };
  }, [input.stateCode, input.county, input.consideration, input.nominal, input.singleFamily]);

  return tax;
}
