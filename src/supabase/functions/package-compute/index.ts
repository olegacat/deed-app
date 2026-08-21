import { runPackageCompute, runTaxSummary } from "../_shared/package-compute/run.ts";
import type { PackageComputeRequest } from "../_shared/package-compute/types.ts";
import type { TaxInput } from "../_shared/tax.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

type TaxSummaryBody = { action: "tax-summary" } & TaxInput;
type PackageBody = { action: "package" } & PackageComputeRequest;
type RequestBody = TaxSummaryBody | PackageBody;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body = (await req.json()) as RequestBody;
    if (body.action === "tax-summary") {
      const { action: _, ...input } = body;
      if (!input.stateCode?.trim()) {
        return errorResponse("stateCode is required.");
      }
      return jsonResponse(runTaxSummary(input));
    }
    if (body.action === "package") {
      const { action: _, ...req_ } = body;
      if (!req_.stateCode?.trim()) {
        return errorResponse("stateCode is required.");
      }
      if (!req_.form) {
        return errorResponse("form is required.");
      }
      return jsonResponse(runPackageCompute(req_));
    }
    return errorResponse('action must be "tax-summary" or "package".');
  } catch (e) {
    const message = e instanceof Error ? e.message : "Package compute failed.";
    return errorResponse(message);
  }
});
