import { Link } from "@tanstack/react-router";

export function Brand({ tagline }: { tagline: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent text-sm font-bold text-accent-foreground">
        D
      </div>
      <div>
        <div className="font-display text-xl leading-tight tracking-tight text-foreground">
          Deed Copilot
        </div>
        <div className="text-xs leading-tight text-muted-foreground">{tagline}</div>
      </div>
    </div>
  );
}

export function Pill({
  tone = "muted",
  children,
}: {
  tone?: "live" | "beta" | "muted" | "info" | "danger";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    live: "border-accent/30 bg-accent/10 text-accent",
    beta: "border-warning/50 bg-warning/15 text-warning-foreground",
    muted: "border-border bg-secondary text-muted-foreground",
    info: "border-success/30 bg-success/10 text-success",
    danger: "border-destructive/40 bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function TopBar({
  subtitle,
  right,
  back,
}: {
  subtitle: string;
  right?: React.ReactNode;
  back?: boolean;
}) {
  return (
    <header className="no-print border-b border-border bg-card/70">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
        {back && (
          <Link
            to="/states"
            className="rounded-sm border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            ← States
          </Link>
        )}
        <Brand tagline={subtitle} />
        <div className="ml-auto">{right}</div>
      </div>
    </header>
  );
}

export function Disclaimer({ children }: { children?: React.ReactNode }) {
  return (
    <footer className="mx-auto mt-12 max-w-6xl border-t border-border px-5 pb-14 pt-8 text-xs font-light leading-loose text-muted-foreground">
      {children ?? (
        <p>
          Prototype for attorney/title review — illustrative drafts, not legal advice, not
          recording-ready.
        </p>
      )}
    </footer>
  );
}

export function SideRail({
  eyebrow,
  title,
  italic,
  body,
  children,
}: {
  eyebrow?: string;
  title: string;
  italic?: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <aside className="no-print flex w-full flex-col bg-sidebar p-8 text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-[400px] lg:w-[460px] lg:p-12">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent text-xs font-bold text-accent-foreground">
          D
        </div>
        <span className="text-xl font-medium tracking-tight">Deed Copilot</span>
      </div>

      <div className="mb-10">
        {eyebrow && (
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-sidebar-foreground/40">
            {eyebrow}
          </p>
        )}
        <h1 className="mb-8 font-display text-5xl leading-[0.95] md:text-6xl">
          {title}
          {italic && (
            <>
              <br />
              <span className="italic text-accent">{italic}</span>
            </>
          )}
        </h1>
        <p className="max-w-sm text-base leading-relaxed text-sidebar-foreground/70">{body}</p>
      </div>

      {children && (
        <div className="space-y-5 border-t border-sidebar-border pt-8">{children}</div>
      )}
      <div className="mt-auto" />
    </aside>
  );
}