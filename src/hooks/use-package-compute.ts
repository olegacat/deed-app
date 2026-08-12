import { useEffect, useState } from "react";
import type { DeedForm } from "@/components/deed/IntakeForm";
import { fetchPackageCompute } from "@/lib/package-compute/client";
import type { PackageComputeResult } from "@/lib/package-compute/types";

/** Fetch package compute result from server when form changes. */
export function usePackageCompute(
  stateCode: string,
  form: DeedForm,
): { loading: boolean; result: PackageComputeResult | null } {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PackageComputeResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchPackageCompute(stateCode, form)
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [stateCode, form]);

  return { loading, result };
}
