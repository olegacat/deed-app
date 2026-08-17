import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AccountShell } from "@/components/deed/AccountShell";
import { PackageView } from "@/components/deed/Package";
import { emptyForm } from "@/components/deed/IntakeForm";
import { defaultCounty, findState } from "@/data/states";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/account/deed/$id")({
  head: () => ({
    meta: [
      { title: "Saved deed package — Deed Copilot" },
      {
        name: "description",
        content: "Review a saved deed matter: tax summary, required forms and the draft deed.",
      },
      { property: "og:title", content: "Saved deed package — Deed Copilot" },
      {
        property: "og:description",
        content: "Review a saved deed matter: tax summary, required forms and the draft deed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavedDeedPage,
});

function SavedDeedPage() {
  const { id } = Route.useParams();
  const { deeds } = useSession();
  const deed = deeds.find((d) => d.id === id);
  const state = deed ? findState(deed.stateCode) : undefined;

  return (
    <AccountShell
      eyebrow="Matter library"
      title="Deed"
      italic="package."
      body={
        deed
          ? `${deed.stateName} · ${deed.county || "—"} · saved ${new Date(deed.savedAt).toLocaleDateString()}`
          : "This matter is no longer stored on this device."
      }
    >
      <Link
        to="/account/saved"
        className="mb-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Saved deeds
      </Link>

      {!deed || !state ? (
        <div className="border border-dashed border-border px-6 py-14 text-center">
          <p className="font-display text-2xl">Deed not found</p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Saved matters live on this device only — this one may have been removed.
          </p>
        </div>
      ) : (
        <PackageView
          state={state}
          form={
            deed.form ?? {
              ...emptyForm(deed.county || defaultCounty(state.code, state.counties), state.code),
              granteeName: deed.grantee,
              consideration: deed.consideration,
            }
          }
        />
      )}
    </AccountShell>
  );
}
