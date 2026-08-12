import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileText, LogOut, Settings, ChevronsUpDown, LogIn, X } from "lucide-react";
import {
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  signOut,
  useSession,
} from "@/lib/session";

export function ProfileRail({
  placement = "bottom",
}: {
  placement?: "top" | "bottom" | "header";
}) {
  const { user, deeds } = useSession();
  const navigate = useNavigate();
  const header = placement === "header";
  const top = placement === "top" || header;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return <SignInRail placement={placement} />;

  const initials =
    (user.name || user.email)
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  const row = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    badge?: string,
    danger?: boolean,
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
        danger
          ? "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-destructive"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge && <span className="text-[10px] text-accent">{badge}</span>}
    </button>
  );

  return (
    <div
      ref={ref}
      className={`no-print relative ${header ? "w-auto" : top ? "" : "mt-8 border-t border-sidebar-border pt-5"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={
          header
            ? `flex items-center gap-2.5 rounded-full border border-border py-1.5 pl-1.5 pr-3 text-left transition-colors ${
                open ? "border-accent bg-secondary" : "hover:border-accent/60 hover:bg-secondary/60"
              }`
            : `flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors ${
                open ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"
              }`
        }
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold tracking-wide text-accent-foreground ${
            header ? "h-8 w-8" : "h-9 w-9"
          }`}
        >
          {initials}
        </div>
        {header ? (
          <span className="hidden max-w-[140px] truncate text-[13px] font-medium text-foreground sm:block">
            {user.name}
          </span>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/45">
              {user.email}
              {user.provider === "google" && " · Google"}
            </p>
          </div>
        )}
        <ChevronsUpDown
          className={`h-3.5 w-3.5 shrink-0 ${header ? "text-muted-foreground" : "text-sidebar-foreground/40"}`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-30 min-w-[260px] rounded-sm border border-sidebar-border bg-sidebar p-1.5 shadow-2xl ${
            header ? "right-0 top-full mt-2 w-[280px]" : "left-0 w-full"
          } ${top ? "top-full mt-2" : "bottom-full mb-2"}`}
        >
          {header && (
            <div className="mb-1 border-b border-sidebar-border px-3 py-2">
              <p className="truncate text-[12px] font-medium text-sidebar-foreground">{user.name}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/45">{user.email}</p>
            </div>
          )}
          <div className="space-y-0.5">
            {row(
              <FileText className="h-3.5 w-3.5" />,
              "Saved deeds",
              () => {
                setOpen(false);
                navigate({ to: "/account/saved" });
              },
              String(deeds.length),
            )}
            {row(<Settings className="h-3.5 w-3.5" />, "Settings", () => {
              setOpen(false);
              navigate({ to: "/account/settings" });
            })}
            <div className="my-1 border-t border-sidebar-border" />
            {row(
              <LogOut className="h-3.5 w-3.5" />,
              "Log out",
              () => {
                signOut();
                setOpen(false);
              },
              undefined,
              true,
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SignInRail({
  placement = "bottom",
}: {
  placement?: "top" | "bottom" | "header";
}) {
  const header = placement === "header";
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const field =
    "w-full rounded-sm border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/25";

  return (
    <div
      className={`no-print ${
        header ? "" : placement === "top" ? "" : "mt-8 border-t border-sidebar-border pt-5"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center justify-center gap-2 bg-accent text-[11px] font-bold uppercase tracking-[0.16em] text-accent-foreground transition-opacity hover:opacity-90 ${
          header ? "rounded-full px-4 py-2" : "w-full rounded-sm px-3 py-2.5"
        }`}
      >
        <LogIn className="h-3.5 w-3.5" />
        Sign in
      </button>
      {placement === "bottom" && (
        <p className="mt-2 text-center text-[11px] leading-snug text-sidebar-foreground/40">
          Sign in to save deeds and revisit matters.
        </p>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sign in to Deed Copilot"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="Close sign in"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-primary/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md border border-border bg-card p-8 text-foreground shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
              Deed Copilot
            </p>
            <h2 className="mt-2 font-display text-3xl leading-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
              <span className="text-accent">.</span>
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Save matters, revisit packages and get the deed emailed to you.
            </p>

            <button
              type="button"
              onClick={async () => {
                setError(null);
                const res = await signInWithGoogle();
                if (!res.ok) setError(res.error ?? "Google sign-in failed.");
              }}
              className="mt-6 w-full rounded-sm border border-input bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
            >
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-3">
              <input
                type="email"
                placeholder="Work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={field}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={field}
              />
              <button
                type="button"
                disabled={!email.trim() || password.length < 6 || busy}
                onClick={async () => {
                  setError(null);
                  setNotice(null);
                  setBusy(true);
                  const res =
                    mode === "signin"
                      ? await signInWithPassword(email.trim(), password)
                      : await signUpWithPassword(email.trim(), password);
                  setBusy(false);
                  if (!res.ok) {
                    setError(res.error ?? "Something went wrong.");
                    return;
                  }
                  if (res.needsConfirmation) {
                    setNotice("Check your inbox to confirm your email, then sign in.");
                    return;
                  }
                  setOpen(false);
                }}
                className="w-full rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
              {error ? <p className="text-[12px] text-destructive">{error}</p> : null}
              {notice ? <p className="text-[12px] text-success">{notice}</p> : null}
            </div>

            <p className="mt-4 text-center text-[12px] text-muted-foreground">
              {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="font-semibold text-accent hover:underline"
              >
                {mode === "signin" ? "Create one" : "Sign in"}
              </button>
            </p>
            <p className="mt-4 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
              Your account is stored securely. Nothing is charged at sign-up.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
