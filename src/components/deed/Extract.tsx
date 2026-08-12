import { useEffect, useState } from "react";
import { Check, Loader2, MapPin, FileText, UserSearch, ScrollText, Layers, Calculator } from "lucide-react";
import type { StateInfo } from "@/data/states";
import type { DeedForm } from "@/components/deed/IntakeForm";

type Tag = "LIVE" | "STUB" | "REAL";

const tagCls: Record<Tag, string> = {
  LIVE: "border-accent/40 bg-accent/10 text-accent",
  STUB: "border-border bg-secondary text-muted-foreground",
  REAL: "border-primary/30 bg-primary/10 text-primary",
};

export function ExtractStep({
  state,
  form,
  onDone,
  onRestart,
}: {
  state: StateInfo;
  form: DeedForm;
  onDone: () => void;
  onRestart: () => void;
}) {
  const address =
    [[form.house, form.street].filter(Boolean).join(" "), form.city].filter(Boolean).join(", ") ||
    "Property address pending";
  const parcel = form.parcel || "parcel pending";
  const owner = form.owner || "Owner of record pending";

  const tasks: { title: string; detail: string; tag: Tag; Icon: typeof MapPin }[] = [
    {
      title: "Resolve parcel",
      detail: `${address} → ${parcel} (${form.county}, ${state.name})`,
      tag: "LIVE",
      Icon: MapPin,
    },
    {
      title: "Pull assessment roll",
      detail: "Class, assessed value and district codes",
      tag: "LIVE",
      Icon: FileText,
    },
    {
      title: "Identify current owner",
      detail: `${owner} → becomes grantor`,
      tag: "LIVE",
      Icon: UserSearch,
    },
    {
      title: "Retrieve deed image (Schedule A)",
      detail: "County search, auto-pay, email-ingest",
      tag: "STUB",
      Icon: ScrollText,
    },
    {
      title: "Determine documents",
      detail: "County-aware required / conditional forms from the facts",
      tag: "REAL",
      Icon: Layers,
    },
    {
      title: "Calculate transfer tax",
      detail: "State and local transfer tax",
      tag: "REAL",
      Icon: Calculator,
    },
  ];

  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done >= tasks.length) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((d) => d + 1), 650);
    return () => clearTimeout(t);
  }, [done]);

  const pct = Math.round((Math.min(done, tasks.length) / tasks.length) * 100);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden border border-border bg-card">
        <div className="border-b border-border bg-secondary/40 px-6 py-6 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                Step 2 · Find &amp; extract
              </p>
              <h2 className="mt-2 font-display text-3xl leading-none text-foreground">
                Building the package
                <span className="text-accent">…</span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{address}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-4xl leading-none tabular-nums text-foreground">{pct}%</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {Math.min(done, tasks.length)} of {tasks.length} sources
              </p>
            </div>
          </div>

          <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <ol className="divide-y divide-border">
          {tasks.map((t, i) => {
            const complete = i < done;
            const active = i === done;
            const Icon = t.Icon;
            return (
              <li
                key={t.title}
                className={`relative flex items-center gap-4 px-6 py-4 transition-colors md:px-8 ${
                  active ? "bg-accent/5" : complete ? "bg-card" : "bg-card opacity-45"
                }`}
              >
                {active && <span className="absolute inset-y-0 left-0 w-[3px] bg-accent" />}
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                    complete
                      ? "border-accent bg-accent text-accent-foreground"
                      : active
                        ? "border-accent/50 bg-background text-accent"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {complete ? (
                    <Check className="h-4 w-4" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{t.title}</span>
                    {active && (
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                        working
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{t.detail}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${tagCls[t.tag]}`}
                >
                  {t.tag}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="border-t border-border bg-secondary/30 px-6 py-3 text-[11px] leading-relaxed text-muted-foreground md:px-8">
          LIVE data comes from public records · STUB is simulated in this prototype · REAL is computed
          from your inputs. Everything still needs attorney verification.
        </p>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="no-print rounded-sm border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-accent hover:text-accent"
      >
        ↺ Start over / change inputs
      </button>
    </div>
  );
}
