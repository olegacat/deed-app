import type { DocumentEdits } from "@/lib/document-edits";
import type { FillPdfRequest } from "@/lib/fill-pdf";
import type { PackageFieldRow } from "@/lib/package-form-fields";
import { usePackagePdfPreview } from "@/hooks/use-package-pdf-preview";
import { useState, type ReactNode } from "react";
import { PackageDocEditor } from "./PackageDocEditor";
import { PackagePdfPreview } from "./PackagePdfPreview";

type ViewMode = "edit" | "preview";

function PanelTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
        active
          ? "border-accent text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function PackageDocPanel({
  docName,
  docNote,
  fields,
  edits,
  onEdit,
  previewPayload,
}: {
  docName: string;
  docNote?: string;
  fields: PackageFieldRow[] | null;
  edits: DocumentEdits;
  onEdit: (key: string, value: string) => void;
  previewPayload: FillPdfRequest;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const preview = usePackagePdfPreview(previewPayload);

  function showPreview() {
    setViewMode("preview");
    if (!preview.url || preview.stale) {
      void preview.refresh();
    }
  }

  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card">
      <div className="no-print flex border-b border-border">
        <PanelTab active={viewMode === "edit"} onClick={() => setViewMode("edit")}>
          Edit fields
        </PanelTab>
        <PanelTab active={viewMode === "preview"} onClick={showPreview}>
          PDF preview
        </PanelTab>
      </div>
      <div className="p-6">
        {viewMode === "edit" ? (
          <PackageDocEditor
            docName={docName}
            {...(docNote ? { docNote } : {})}
            fields={fields}
            edits={edits}
            onEdit={onEdit}
          />
        ) : (
          <PackagePdfPreview
            url={preview.url}
            loading={preview.loading}
            error={preview.error}
            stale={preview.stale}
            onRefresh={() => void preview.refresh()}
          />
        )}
      </div>
    </div>
  );
}
