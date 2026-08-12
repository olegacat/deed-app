import { wizardSteps } from "@/lib/jurisdiction-config";

type Props = {
  variant: "rail" | "top";
  stateCode: string;
  step: number;
};

export function ProgressSteps({ variant, stateCode, step }: Props) {
  const steps = wizardSteps(stateCode);
  const rail = variant === "rail";
  const dim = rail ? "text-sidebar-foreground" : "text-foreground";
  const track = rail ? "bg-sidebar-foreground/15" : "bg-border";

  if (rail) {
    return (
      <nav className="mb-8">
        <Header step={step} total={steps.length} dim={dim} />
        <div className={`mb-6 h-1 w-full ${track}`}>
          <div
            className="h-1 bg-accent transition-all"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
        <ol className="space-y-1">
          {steps.map((s, n) => {
            const active = step === n;
            const done = step > n;
            return (
              <li
                key={s.label}
                className={`flex items-start gap-3 rounded-sm px-3 py-2.5 ${
                  active ? "bg-sidebar-accent" : ""
                }`}
              >
                <span
                  className={`mt-0.5 text-[11px] font-bold tracking-[0.18em] ${
                    active || done ? "text-accent" : "text-sidebar-foreground/35"
                  }`}
                >
                  {done ? "✓" : `0${n + 1}`}
                </span>
                <span>
                  <span
                    className={`block text-xs font-bold uppercase tracking-[0.18em] ${
                      active ? "text-sidebar-foreground" : "text-sidebar-foreground/50"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="block text-[11px] leading-relaxed text-sidebar-foreground/40">
                    {s.note}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <nav className="mb-10 border border-border bg-card px-5 py-4">
      <Header step={step} total={steps.length} dim={dim} />
      <div className={`mb-4 h-1 w-full ${track}`}>
        <div
          className="h-1 bg-accent transition-all"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, n) => {
          const active = step === n;
          const done = step > n;
          return (
            <li
              key={s.label}
              className={`flex items-start gap-2 rounded-sm px-3 py-2 ${
                active ? "bg-secondary" : ""
              }`}
            >
              <span
                className={`mt-0.5 text-[11px] font-bold tracking-[0.18em] ${
                  active || done ? "text-accent" : "text-muted-foreground/60"
                }`}
              >
                {done ? "✓" : `0${n + 1}`}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-[11px] font-bold uppercase tracking-[0.16em] ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
                <span className="block text-[11px] leading-relaxed text-muted-foreground/70">
                  {s.note}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Header({ step, total, dim }: { step: number; total: number; dim: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <p className={`text-[10px] font-bold uppercase tracking-[0.25em] ${dim}/40`}>Progress</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
        Step {step + 1} of {total}
      </p>
    </div>
  );
}

export function ProgressViewSwitcher({
  value,
  onChange,
}: {
  value: "rail" | "top";
  onChange: (v: "rail" | "top") => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
      {(
        [
          { v: "rail", label: "Side" },
          { v: "top", label: "Top" },
        ] as const
      ).map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${
            value === o.v
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
