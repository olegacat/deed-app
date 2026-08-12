import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { signOut, updateProfile, useSession } from "@/lib/session";
import { AccountShell } from "@/components/deed/AccountShell";

export const Route = createFileRoute("/account/settings")({
  head: () => ({
    meta: [
      { title: "Account settings — Deed Copilot" },
      {
        name: "description",
        content: "Edit your Deed Copilot profile, firm details and password for the prototype.",
      },
      { property: "og:title", content: "Account settings — Deed Copilot" },
      {
        property: "og:description",
        content: "Edit your Deed Copilot profile, firm details and password for the prototype.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useSession();
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setFirm(user.firm);
    }
  }, [user?.email]);

  const field =
    "w-full rounded-sm border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/25 disabled:opacity-50";

  return (
    <AccountShell
      eyebrow="Your account"
      title="Profile &"
      italic="settings."
      body="Prototype account controls — changes are stored locally on this device only."
    >
      {!user && (
        <p className="mb-8 border border-border bg-secondary px-5 py-4 text-sm text-muted-foreground">
          Sign in from the account menu to edit your profile.
        </p>
      )}

      <section className="border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Edit profile</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Full name
            </span>
            <input
              value={name}
              disabled={!user}
              onChange={(e) => setName(e.target.value)}
              className={field}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Firm
            </span>
            <input
              value={firm}
              disabled={!user}
              onChange={(e) => setFirm(e.target.value)}
              className={field}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Email
            </span>
            <input value={user?.email ?? ""} disabled className={field} />
          </label>
        </div>
        <button
          type="button"
          disabled={!user}
          onClick={() => {
            updateProfile({ name: name.trim() || user!.name, firm: firm.trim() });
            setNote("Profile updated.");
          }}
          className="mt-5 rounded-sm bg-accent px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Save profile
        </button>
      </section>

      <section className="mt-6 border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Password</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We email a reset link to your address. Simulated in this prototype.
        </p>
        <button
          type="button"
          disabled={!user}
          onClick={() => setNote(`Password reset link sent to ${user?.email} (simulated).`)}
          className="mt-4 rounded-sm border border-input px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
        >
          Reset password
        </button>
      </section>

      {user && (
        <section className="mt-6 border border-border bg-card p-6">
          <h2 className="font-display text-2xl">Session</h2>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-4 rounded-sm border border-input px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            Log out
          </button>
        </section>
      )}

      {note && <p className="mt-5 text-sm font-medium text-accent">{note}</p>}
    </AccountShell>
  );
}