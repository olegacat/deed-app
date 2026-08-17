import type { DocumentEdits } from "@/lib/document-edits";
import { packageFieldEditKey, type PackageFieldRow } from "@/lib/package-form-fields";
import { EditableField } from "./EditableField";

const READONLY_LABELS = new Set(["Legal description"]);

export function PackageDocEditor({
  docName,
  docNote,
  fields,
  edits,
  onEdit,
}: {
  docName: string;
  docNote?: string;
  fields: PackageFieldRow[] | null;
  edits: DocumentEdits;
  onEdit: (key: string, value: string) => void;
}) {
  return (
    <div>
      <h3 className="font-display text-xl text-foreground">{docName}</h3>
      {docNote ? (
        <p className="mt-2 rounded-sm border-l-4 border-info bg-info/5 px-3 py-2 text-[13px] leading-relaxed text-foreground">
          {docNote}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Fields below match what is sent to the PDF generator for this document. Click any
          highlighted value to edit before downloading.
        </p>
      )}
      {fields ? (
        <div className="mt-4 space-y-2 font-serif-doc text-[14px] leading-7 text-foreground">
          {fields.map(([label, value]) => (
            <p key={label}>
              <span className="inline-block w-56 shrink-0 text-muted-foreground">{label}</span>{" "}
              {READONLY_LABELS.has(label) ? (
                <span className="rounded-sm border border-warning/50 bg-warning/10 px-1.5 py-0.5 text-[0.95em]">
                  {value}
                </span>
              ) : (
                <EditableField
                  editKey={packageFieldEditKey(docName, label)}
                  value={value}
                  edits={edits}
                  onEdit={onEdit}
                  variant="generic"
                />
              )}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No field-level preview for this document — it is included in the downloaded PDF bundle.
        </p>
      )}
    </div>
  );
}
