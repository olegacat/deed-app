import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StateInfo } from "@/data/states";
import { getJurisdictionConfig } from "@/lib/jurisdiction-config";

const TONES: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
};

export function SellingPoints({
  state,
  formulaCopy,
  verified,
}: {
  state: StateInfo;
  formulaCopy: string;
  verified: boolean;
}) {
  const cfg = getJurisdictionConfig(state.code);
  const [index, setIndex] = useState(0);

  const points = [
    {
      tag: "Real",
      tone: "success" as const,
      subtitle: "Verified rate logic",
      body: cfg.engineNote || formulaCopy,
    },
    {
      tag: "Manual",
      tone: "warning" as const,
      subtitle: "Parcel data",
      body: cfg.liveNote,
    },
    {
      tag: "From deed",
      tone: "info" as const,
      subtitle: "Recorded instrument",
      body: `Owner/vesting + legal description — from the recorded deed at the ${cfg.recordingLabel}.`,
    },
  ];

  const prev = () => setIndex((i) => (i === 0 ? points.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === points.length - 1 ? 0 : i + 1));

  const current = points[index];

  return (
    <div className="no-print rounded-sm border border-sidebar-border bg-sidebar-accent/40 p-5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sidebar-foreground/40">
          What's live vs. provided
        </p>
        <div className="flex gap-1.5">
          {points.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === index ? "bg-accent" : "bg-sidebar-foreground/20"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {points.map((p) => (
            <div key={p.tag} className="w-full shrink-0">
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-medium ${TONES[p.tone]}`}>{p.tag}</span>
                <span className="text-[11px] italic text-sidebar-foreground/45">{p.subtitle}</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-sidebar-foreground/65">{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-sidebar-border pt-4">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous"
          className="rounded-full p-1.5 text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/40">
          {String(index + 1).padStart(2, "0")} / {String(points.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={next}
          aria-label="Next"
          className="rounded-full p-1.5 text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 border-t border-sidebar-border pt-4">
        <div className="flex items-start gap-2.5">
          <span
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${verified ? "bg-success" : "bg-warning"}`}
          />
          <p className="text-[11.5px] leading-relaxed text-sidebar-foreground/65">
            {verified
              ? `${state.name} transfer-tax rates are verified against the state schedule. Output is an illustrative draft for attorney/title review before recording.`
              : `${state.name} module is in beta — rates are research-grade; verify before recording.`}
          </p>
        </div>
      </div>
    </div>
  );
}
