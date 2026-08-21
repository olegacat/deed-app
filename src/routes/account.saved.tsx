import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { deedAccessLabel } from "@/lib/deed-draft";
import { removeDeed, useSession, type SavedDeed } from "@/lib/session";
import { AccountShell } from "@/components/deed/AccountShell";

export const Route = createFileRoute("/account/saved")({
  head: () => ({
    meta: [
      { title: "My packages — Deed Copilot" },
      {
        name: "description",
        content: "Reopen purchased single packages, subscription deeds, and in-progress drafts.",
      },
      { property: "og:title", content: "My packages — Deed Copilot" },
      {
        property: "og:description",
        content: "Every deed you started or paid for, ready to reopen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavedPage,
});

function SavedDeedSummary({ deed: d }: { deed: SavedDeed }) {
  return (
    <>
      <p className="truncate font-display text-xl leading-snug">
        {d.address || "Untitled property"}
      </p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {d.stateName} · {d.county || "—"} · {deedAccessLabel(d.status, d.checkout?.plan)} ·{" "}
        {new Date(d.savedAt).toLocaleDateString()}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Grantee: {d.grantee || "—"} · Consideration: {d.consideration || "—"}
      </p>
    </>
  );
}

function DeedRow({ d }: { d: SavedDeed }) {
  return (
    <li className="flex items-start gap-4 px-5 py-4">
      {d.status === "paid" ? (
        <Link
          to="/account/deed/$id"
          params={{ id: d.id }}
          className="min-w-0 flex-1 text-left transition-colors hover:text-accent"
        >
          <SavedDeedSummary deed={d} />
        </Link>
      ) : (
        <Link
          to="/deed/$state"
          params={{ state: d.stateCode }}
          search={{ draft: d.id }}
          className="min-w-0 flex-1 text-left transition-colors hover:text-accent"
        >
          <SavedDeedSummary deed={d} />
        </Link>
      )}
      <button
        type="button"
        onClick={() => removeDeed(d.id)}
        aria-label="Remove saved deed"
        className="mt-1 text-muted-foreground transition-colors hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function DeedGroup({ title, items }: { title: string; items: SavedDeed[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </h2>
      <ul className="divide-y divide-border border border-border bg-card">
        {items.map((d) => (
          <DeedRow key={d.id} d={d} />
        ))}
      </ul>
    </section>
  );
}

function SavedPage() {
  const { user, deeds, loading } = useSession();
  const mine = user ? deeds : [];
  const inProgress = mine.filter((d) => d.status !== "paid");
  const purchased = mine.filter((d) => d.status === "paid");

  return (
    <AccountShell
      eyebrow="Matter library"
      title="My"
      italic="packages."
      body="Every deed you paid for — single package or firm monthly — and any draft still in progress. Open one to keep editing the package."
    >
      {!user && (
        <p className="mb-8 border border-border bg-secondary px-5 py-4 text-sm text-muted-foreground">
          Sign in from the account menu to see your purchased packages.
        </p>
      )}

      {user && loading ? (
        <p className="text-sm text-muted-foreground">Loading packages…</p>
      ) : user && mine.length === 0 ? (
        <div className="border border-dashed border-border px-6 py-14 text-center">
          <p className="font-display text-2xl">No packages yet</p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Start a deed, then check out. Paid single and subscription matters show up here so you
            can reopen them later.
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
        <>
          <DeedGroup title="Purchased packages" items={purchased} />
          <DeedGroup title="In progress" items={inProgress} />
        </>
      )}
    </AccountShell>
  );
}
