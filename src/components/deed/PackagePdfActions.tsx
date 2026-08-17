import {
  downloadPackagePdf,
  fetchPackagePdfBlob,
  printPackagePdfBlob,
  type FillPdfRequest,
} from "@/lib/fill-pdf";
import { useState } from "react";

export function PackagePdfActions({
  buildPayload,
  filename,
}: {
  buildPayload: () => FillPdfRequest;
  filename: string;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function dlPdf() {
    setBusy(true);
    setMsg(null);
    try {
      await downloadPackagePdf(buildPayload(), filename);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "PDF generation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function printPdf() {
    setBusy(true);
    setMsg(null);
    try {
      const blob = await fetchPackagePdfBlob(buildPayload());
      printPackagePdfBlob(blob);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "PDF print failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {msg && (
        <p className="rounded-sm border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-warning">
          {msg}
        </p>
      )}
      <div className="no-print flex gap-3">
        <button
          type="button"
          onClick={() => void dlPdf()}
          disabled={busy}
          className="cursor-pointer rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-70"
        >
          {busy ? "Building…" : "⬇ Complete package (PDF)"}
        </button>
        <button
          type="button"
          onClick={() => void printPdf()}
          disabled={busy}
          className="cursor-pointer rounded-sm border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary disabled:cursor-wait disabled:opacity-70"
        >
          {busy ? "Building…" : "⤓ Print PDF"}
        </button>
      </div>
    </>
  );
}
