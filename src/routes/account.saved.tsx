import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { removeDeed, useSession, type SavedDeed } from "@/lib/session";
import { AccountShell } from "@/components/deed/AccountShell";

export const Route = createFileRoute("/account/saved")({
  head: () => ({
    meta: [
      { title: "Saved deeds — Deed Copilot" },
      {
        name: "description",
        content: "Every deed matter you saved in Deed Copilot, with jurisdiction and date.",
      },
      { property: "og:title", content: "Saved deeds — Deed Copilot" },
      {
        property: "og:description",
        content: "Every deed matter you saved in Deed Copilot, with jurisdiction and date.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { user, deeds } = useSession();

  return (
    <AccountShell
      eyebrow="Matter library"
      title="Saved"
      italic="deeds."
      body="Every package you saved is kept on this device for the prototype — nothing is stored on a server."
    >
      {!user && (
        <p className="mb-8 border border-border bg-secondary px-5 py-4 text-sm text-muted-foreground">
          Sign in from the account menu to save matters.
        </p>
      )}

      {deeds.length === 0 ? (
        <div className="border border-dashed border-border px-6 py-14 text-center">
          <p className="font-display text-2xl">No saved deeds yet</p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Completing checkout stores the matter here so you can revisit the package.
          </p>
          <Link
            to="/states"
            className="mt-6 inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-accent-foreground transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Start a new matter
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border bg-card">
          {deeds.map((d: SavedDeed) => (
            <li key={d.id} className="flex items-start gap-4 px-5 py-4">
              <Link
                to="/account/deed/$id"
                params={{ id: d.id }}
                className="min-w-0 flex-1 text-left transition-colors hover:text-accent"
              >
                <p className="truncate font-display text-xl leading-snug">
                  {d.address || "Untitled property"}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {d.stateName} · {d.county || "—"} ·{" "}
                  {new Date(d.savedAt).toLocaleDateString()}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Grantee: {d.grantee || "—"} · Consideration: {d.consideration || "—"}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => removeDeed(d.id)}
                aria-label="Remove saved deed"
                className="mt-1 text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
