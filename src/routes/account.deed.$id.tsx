import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PackageView } from "@/components/deed/Package";
import { ProfileRail } from "@/components/deed/ProfileRail";
import { emptyForm } from "@/components/deed/IntakeForm";
import { defaultCounty, findState } from "@/data/states";
import { deedAccessLabel } from "@/lib/deed-draft";
import { loadDeedById, useSession, type SavedDeed } from "@/lib/session";

export const Route = createFileRoute("/account/deed/$id")({
  head: () => ({
    meta: [
      { title: "Deed package — Deed Copilot" },
      {
        name: "description",
        content: "Open a purchased deed package: edit fields, preview forms, and download the PDF.",
      },
      { property: "og:title", content: "Deed package — Deed Copilot" },
      {
        property: "og:description",
        content: "Reopen a single or subscription deed package from your account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavedDeedPage,
});

function SavedDeedPage() {
  const { id } = Route.useParams();
  const { deeds, loading } = useSession();
  const fromList = deeds.find((d) => d.id === id);
  const [fetched, setFetched] = useState<SavedDeed | null | undefined>(undefined);

  useEffect(() => {
    if (fromList || loading) {
      setFetched(undefined);
      return;
    }
    let cancelled = false;
    void loadDeedById(id).then((row) => {
      if (!cancelled) setFetched(row);
    });
    return () => {
      cancelled = true;
    };
  }, [id, fromList, loading]);

  const deed = fromList ?? (fetched === undefined ? undefined : fetched);
  const state = deed ? findState(deed.stateCode) : undefined;
  const waiting = loading || (deed === undefined && fetched === undefined);

  const form =
    deed && state
      ? (deed.form ?? {
          ...emptyForm(deed.county || defaultCounty(state.code, state.counties), state.code),
          granteeName: deed.grantee,
          consideration: deed.consideration,
        })
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      <aside className="no-print flex w-full flex-col bg-sidebar p-8 text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-[340px] lg:w-[380px] lg:p-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent text-xs font-bold text-accent-foreground">
            D
          </div>
          <span className="text-lg font-medium tracking-tight">Deed Copilot</span>
        </div>

        <Link
          to="/account/saved"
          className="mb-8 w-fit rounded-full border border-sidebar-border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/70 transition-colors hover:border-accent hover:text-accent"
        >
          ← My packages
        </Link>

        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-sidebar-foreground/40">
          {deed ? deedAccessLabel(deed.status, deed.checkout?.plan) : "Package"}
        </p>
        <h1 className="font-display text-5xl leading-[0.95]">
          {state?.name ?? "Deed"}
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-sidebar-foreground/70">
          {deed
            ? `${deed.address || "Untitled property"} · ${deed.county || "—"}`
            : "Loading this matter…"}
        </p>
        {deed && (
          <p className="mt-4 text-[11px] leading-relaxed text-sidebar-foreground/50">
            Edit highlighted fields, preview PDFs, and download the same package from checkout.
          </p>
        )}
        <div className="mt-auto" />
      </aside>

      <main className="min-w-0 flex-1 p-6 md:p-10 lg:p-14">
        <div className="no-print mb-8 flex justify-end">
          <ProfileRail placement="header" />
        </div>

        {waiting ? (
          <p className="text-sm text-muted-foreground">Loading package…</p>
        ) : !deed || !state || !form ? (
          <div className="border border-dashed border-border px-6 py-14 text-center">
            <p className="font-display text-2xl">Deed not found</p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              This matter may have been removed, or you need to sign in to open it.
            </p>
            <Link
              to="/account/saved"
              className="mt-6 inline-block text-[11px] font-bold uppercase tracking-[0.16em] text-accent"
            >
              Back to my packages
            </Link>
          </div>
        ) : (
          <PackageView state={state} form={form} />
        )}
      </main>
    </div>
  );
}
