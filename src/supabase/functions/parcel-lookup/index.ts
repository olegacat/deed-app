import { runParcelLookup } from "../_shared/parcel-lookup/run.ts";
import type { ParcelLookupInput } from "../_shared/parcel-lookup/types.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const body = (await req.json()) as ParcelLookupInput;
    if (!body.stateCode?.trim()) {
      return errorResponse("stateCode is required.");
    }
    const results = await runParcelLookup(body);
    return jsonResponse(results);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Parcel lookup failed.";
    return errorResponse(message);
  }
});
