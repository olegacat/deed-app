import type { StateInfo } from "@/data/states";
import { Pill } from "./Chrome";

export function HonestyPanel({ state, formulaCopy, verified }: { state: StateInfo; formulaCopy: string; verified: boolean }) {
  return (
    <details className="group border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4">
        <span>
          <span className="font-display text-lg text-foreground">What's live vs. provided</span>
          <span className="ml-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Optional reading
          </span>
        </span>
        <span className="text-xs text-accent transition-transform group-open:rotate-180">▾</span>
      </summary>

      <div className="space-y-4 border-t border-border px-6 pb-6 pt-5 text-[13px] leading-relaxed text-foreground">
        <p>
          <Pill tone="live">Real</Pill>{" "}
          <span className="ml-1">{formulaCopy}</span>
        </p>
        <p>
          <Pill tone="beta">Best-effort</Pill>{" "}
          <span className="ml-1">
            The live-lookup layer queries {state.openDataLabel ?? "public open data"} straight from
            your browser. It can time out, rate-limit or return no match — manual entry is the
            reliable path and never blocks the package.
          </span>
        </p>
        <p>
          <Pill tone="info">From deed</Pill>{" "}
          <span className="ml-1">
            Owner / vesting and the legal description come from the recorded instrument, not the
            cadastral roll. Retrieval of the recorded deed image is not automated yet — that block
            stays a placeholder until you paste it in.
          </span>
        </p>
      </div>

      <div
        className={`mx-6 mb-6 border-l-4 py-3 pl-4 text-[13px] leading-relaxed ${
          verified ? "border-info bg-info/5 text-foreground" : "border-warning bg-warning/10 text-foreground"
        }`}
      >
        {verified ? (
          <>
            The {state.name} tax rate used here has been verified against the state's official
            schedule. Output is still a <strong>draft for attorney/title review</strong> before
            recording.
          </>
        ) : (
          <>
            {state.name} is a beta jurisdiction: the rate is <strong>research-grade</strong> and has
            not been verified against the state's official schedule. Treat everything here as a
            draft for attorney/title review.
          </>
        )}
      </div>
    </details>
  );
}