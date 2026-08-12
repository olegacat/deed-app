import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Building2, CreditCard, LayoutDashboard, LogOut, Map } from "lucide-react";
import { adminSignOut, getAdmin, useAdminStore } from "@/lib/admin-store";

const nav = [
  { to: "/admin", label: "Dashboard", exact: true, icon: LayoutDashboard },
  { to: "/admin/jurisdictions", label: "Jurisdictions & rates", icon: Map },
  { to: "/admin/accounts", label: "Account lookup", icon: Building2 },
  { to: "/admin/usage", label: "Usage & API cost", icon: BarChart3 },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
] as const;

export function AdminShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const store = useAdminStore();
  const admin = store.admin ?? (typeof window !== "undefined" ? getAdmin() : null);
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => setChecked(true), []);

  useEffect(() => {
    if (checked && !getAdmin()) navigate({ to: "/admin/login", replace: true });
  }, [checked, admin, navigate]);

  // Render nothing until the client has mounted — the session lives in
  // localStorage, so an SSR render would never match the hydrated tree.
  if (!checked || !admin) return null;

  return (
    <div className="flex min-h-screen bg-muted/30 font-sans text-foreground">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
          <span className="flex size-8 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-primary-foreground">
            DC
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">Deed Copilot</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Internal admin</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {nav.map((n) => {
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: (n as { exact?: boolean }).exact ?? false }}
                className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{
                  className:
                    "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm bg-primary/10 font-medium !text-foreground shadow-[inset_2px_0_0_0_var(--color-primary)]",
                }}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3 text-xs">
          <div className="flex items-center gap-2.5 rounded-sm bg-muted/60 px-2.5 py-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold">
              {admin.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{admin.name}</p>
              <p className="truncate text-muted-foreground">{admin.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              adminSignOut();
              navigate({ to: "/admin/login", replace: true });
            }}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-sm border border-border px-2 py-1.5 text-xs transition-colors hover:bg-muted"
          >
            <LogOut className="size-3.5" strokeWidth={1.75} /> Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <h1 className="font-display text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-3 flex gap-1 overflow-x-auto md:hidden">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-sm border border-border px-2 py-1 text-xs">
                {n.label}
              </Link>
            ))}
          </div>
        </header>
        <div className="mx-auto max-w-[1400px] p-6">{children}</div>
      </main>
    </div>
  );
}

export function Card({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-border bg-card shadow-sm">
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    Active: "bg-success/15 text-success",
    Live: "bg-success/15 text-success",
    Trial: "bg-info/15 text-info",
    Beta: "bg-warning/20 text-warning",
    "Past due": "bg-destructive/15 text-destructive",
    Paused: "bg-warning/20 text-warning",
    Canceled: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-[11px] font-medium ${tone[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-sm border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  onCancel,
  onConfirm,
  disabled,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="w-full max-w-md rounded-sm border border-border bg-card shadow-lg">
        <header className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
        </header>
        <div className="space-y-3 p-4 text-sm">{body}</div>
        <footer className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button onClick={onCancel} className="rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className="rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}