import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Settings } from "lucide-react";
import { ProfileRail } from "./ProfileRail";

export function AccountShell({
  eyebrow,
  title,
  italic,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  italic: string;
  body: string;
  children: React.ReactNode;
}) {
  const navLink =
    "flex items-center gap-3 rounded-sm px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      <aside className="flex w-full flex-col bg-sidebar p-8 text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-[340px] lg:w-[380px] lg:p-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent text-xs font-bold text-accent-foreground">
            D
          </div>
          <span className="text-lg font-medium tracking-tight">Deed Copilot</span>
        </div>

        <div className="mb-10">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-sidebar-foreground/40">
            {eyebrow}
          </p>
          <h1 className="font-display text-5xl leading-[0.95]">
            {title}
            <br />
            <span className="italic text-accent">{italic}</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-sidebar-foreground/70">{body}</p>
        </div>

        <nav className="space-y-1 border-t border-sidebar-border pt-6">
          <Link
            to="/account/saved"
            className={navLink}
            activeProps={{ className: `${navLink} bg-sidebar-accent !text-sidebar-foreground` }}
          >
            <FileText className="h-3.5 w-3.5" />
            Saved deeds
          </Link>
          <Link
            to="/account/settings"
            className={navLink}
            activeProps={{ className: `${navLink} bg-sidebar-accent !text-sidebar-foreground` }}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
          <Link to="/states" className={navLink}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to states
          </Link>
        </nav>

        <div className="mt-auto" />
      </aside>

      <main className="flex-1 p-6 md:p-10 lg:p-14">
        <div className="mb-10 flex justify-end">
          <ProfileRail placement="header" />
        </div>
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}