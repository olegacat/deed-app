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

export async function fetchPackagePdfBlob(payload: FillPdfRequest): Promise<Blob> {
  const { pdfBase64 } = await invokeEdgeFunction<{ pdfBase64: string }>(
    "fetch-package-pdf",
    payload,
  );
  return base64ToBlob(pdfBase64, "application/pdf");
}

export async function downloadPackagePdf(
  payload: FillPdfRequest,
  filename: string,
): Promise<void> {
  const blob = await fetchPackagePdfBlob(payload);
  triggerDownload(blob, filename);
}

export function printPackagePdfBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Pop-up blocked. Allow pop-ups to print the package PDF.");
  }
  const tryPrint = () => {
    try {
      win.focus();
      win.print();
    } catch {
      /* PDF viewer may not be ready yet */
    }
  };
  win.addEventListener("load", tryPrint);
  setTimeout(tryPrint, 1500);
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}
