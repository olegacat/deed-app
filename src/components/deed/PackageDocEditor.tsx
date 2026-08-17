import type { DocumentEdits } from "@/lib/document-edits";
import { packageFieldEditKey, type PackageFieldRow } from "@/lib/package-form-fields";
import { EditableField } from "./EditableField";

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
          highlighted value to edit — changes sync across all documents in the package.
        </p>
      )}
      {fields ? (
        <dl className="mt-4 space-y-3 text-[14px] leading-relaxed text-foreground">
          {fields.map(([label, value]) => (
            <div
              key={label}
              className={
                label === "Legal description"
                  ? "space-y-1.5"
                  : "grid gap-1 sm:grid-cols-[minmax(0,13rem)_1fr] sm:items-start sm:gap-4"
              }
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0">
                <EditableField
                  editKey={packageFieldEditKey(docName, label)}
                  value={value}
                  edits={edits}
                  onEdit={onEdit}
                  variant={label === "Legal description" ? "legal" : "generic"}
                  multiline={label === "Legal description"}
                  className={label === "Legal description" ? "block w-full" : "inline-block max-w-full break-words"}
                />
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No field-level preview for this document — it is included in the downloaded PDF bundle.
        </p>
      )}
    </div>
  );
}
