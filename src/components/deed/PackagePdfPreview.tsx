export function PackagePdfPreview({
  url,
  loading,
  error,
  stale,
  onRefresh,
}: {
  url: string | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  onRefresh: () => void;
}) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Same PDF as <strong className="font-semibold text-foreground">Complete package (PDF)</strong>{" "}
          — deed and all required forms in filing order.
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="cursor-pointer rounded-sm border border-input bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? "Building…" : stale ? "Refresh preview" : "Reload PDF"}
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-sm border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-warning">
          {error}
        </p>
      )}

      {stale && !loading && (
        <p className="mb-3 rounded-sm border border-info/40 bg-info/5 px-3 py-2 text-xs text-foreground">
          Field edits changed since the last preview — click <strong>Refresh preview</strong> to update.
        </p>
      )}

      {loading && !url && (
        <div className="flex h-[70vh] items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
          Building PDF preview…
        </div>
      )}

      {url && (
        <iframe
          src={url}
          title="Complete package PDF preview"
          className="h-[70vh] w-full rounded-sm border border-border bg-white"
        />
      )}
    </div>
  );
}
