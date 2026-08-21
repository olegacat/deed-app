import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

const PDF_SERVICE_URL = Deno.env.get("PDF_SERVICE_URL") ?? "https://deedcopilot.netlify.app";
const PDF_FILL_PATH = "/.netlify/functions/fill-forms";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const payload = await req.json();
    const res = await fetch(`${PDF_SERVICE_URL}${PDF_FILL_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return errorResponse(
        detail ? `Form service error (${res.status}): ${detail}` : `Form service error (${res.status})`,
        res.status,
      );
    }

    const bytes = new Uint8Array(await res.arrayBuffer());
    return jsonResponse({ pdfBase64: bytesToBase64(bytes) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "PDF generation failed.";
    return errorResponse(message, 500);
  }
});
