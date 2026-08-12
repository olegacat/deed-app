import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ADMIN_HINT, adminSignIn, useAdminStore } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Internal Admin Sign-in — Deed Copilot" },
      { name: "description", content: "Internal-only sign-in for the Deed Copilot operations console." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Internal Admin Sign-in — Deed Copilot" },
      { property: "og:description", content: "Internal-only sign-in for the Deed Copilot operations console." },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const { admin } = useAdminStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => setChecked(true), []);

  useEffect(() => {
    if (checked && admin) navigate({ to: "/admin", replace: true });
  }, [checked, admin, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6 font-sans">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const res = adminSignIn(email, password);
          if (!res.ok) setError(res.error ?? "Sign-in failed.");
          else navigate({ to: "/admin" });
        }}
        className="w-full max-w-sm rounded-sm border border-border bg-card p-6"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Deed Copilot</p>
        <h1 className="mt-1 text-lg font-semibold">Internal admin sign-in</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Staff credentials only. This login is separate from customer accounts and cannot be used to reach the
          customer app.
        </p>

        <label className="mt-5 block text-xs font-medium text-muted-foreground">
          Work email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="username"
            className="mt-1 w-full rounded-sm border border-input bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-ring"
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-muted-foreground">
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-sm border border-input bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-ring"
          />
        </label>

        {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}

        <button type="submit" className="mt-5 w-full rounded-sm bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
          Sign in
        </button>

        <p className="mt-4 rounded-sm bg-muted px-3 py-2 text-[11px] text-muted-foreground">
          Prototype credentials — {ADMIN_HINT.email} / {ADMIN_HINT.password}
        </p>
      </form>
    </div>
  );
}