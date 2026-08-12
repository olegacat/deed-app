import { invokeEdgeFunction } from "@/lib/supabase-edge";

export type FillPdfRequest = {
  input: Record<string, unknown>;
  parcel: Record<string, unknown>;
};

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPackagePdf(
  payload: FillPdfRequest,
  filename: string,
): Promise<void> {
  const { pdfBase64 } = await invokeEdgeFunction<{ pdfBase64: string }>(
    "fetch-package-pdf",
    payload,
  );
  triggerDownload(base64ToBlob(pdfBase64, "application/pdf"), filename);
}
