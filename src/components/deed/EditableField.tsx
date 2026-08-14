import { useEffect, useRef, useState, type RefObject } from "react";
import type { DocumentEdits } from "@/lib/document-edits";

type Variant = "generic" | "nj" | "legal";

const variantCls: Record<Variant, string> = {
  generic:
    "rounded-sm bg-secondary px-1.5 py-0.5 text-[0.95em] text-foreground cursor-text hover:ring-2 hover:ring-accent/30",
  nj: "border-b border-[#e8d48a] bg-[#fffbe9] px-0.5 font-semibold text-[#222] cursor-text hover:ring-2 hover:ring-accent/30",
  legal:
    "block w-full rounded-sm border border-warning/50 bg-warning/10 px-4 py-3 text-[13px] leading-relaxed cursor-text hover:ring-2 hover:ring-accent/30",
};

export function EditableField({
  editKey,
  value,
  edits,
  onEdit,
  variant = "generic",
  multiline = false,
  className = "",
}: {
  editKey: string;
  value: string;
  edits: DocumentEdits;
  onEdit: (key: string, value: string) => void;
  variant?: Variant;
  multiline?: boolean;
  className?: string;
}) {
  const display = edits[editKey] ?? value;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(display);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(edits[editKey] ?? value);
  }, [editing, edits, editKey, value]);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  function commit() {
    onEdit(editKey, draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(edits[editKey] ?? value);
    setEditing(false);
  }

  if (editing) {
    const shared =
      "min-w-[8ch] max-w-full border border-ring bg-card px-1.5 py-0.5 text-[0.95em] text-foreground outline-none ring-2 ring-ring/25";
    if (multiline) {
      return (
        <textarea
          ref={ref as RefObject<HTMLTextAreaElement>}
          value={draft}
          rows={4}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancel();
          }}
          className={`${variantCls.legal} ${shared} w-full resize-y`}
        />
      );
    }
    return (
      <input
        ref={ref as RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className={`${variantCls[variant]} ${shared} inline-block`}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      title="Click to edit"
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setEditing(true);
        }
      }}
      className={`${variantCls[variant]} ${className}`}
    >
      {display}
    </span>
  );
}
