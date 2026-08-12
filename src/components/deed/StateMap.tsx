import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { STATES, type StateStatus } from "@/data/states";

const TONE: Record<StateStatus, string> = {
  live: "bg-accent text-accent-foreground shadow-sm hover:brightness-110",
  beta: "bg-primary/8 text-foreground/70 hover:bg-accent/20 hover:text-accent",
  "coming-soon": "bg-primary/5 text-foreground/35 hover:bg-primary/10",
};

const LABEL: Record<StateStatus, string> = {
  live: "Live",
  beta: "Beta",
  "coming-soon": "Coming soon",
};

export function StateMap() {
  const navigate = useNavigate();
  const [hover, setHover] = useState<string | null>(null);
  const hovered = STATES.find((s) => s.code === hover);

  const maxRow = Math.max(...STATES.map((s) => s.row));
  const cell = 46;
  const gap = 6;

  return (
    <div className="border border-border bg-card p-6">
      <div className="mx-auto w-full overflow-x-auto">
        <div
          className="relative mx-auto"
          style={{ width: 12.5 * (cell + gap), height: maxRow * (cell + gap) }}
        >
          {STATES.map((s) => (
            <button
              key={s.code}
              type="button"
              onMouseEnter={() => setHover(s.code)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(s.code)}
              onBlur={() => setHover(null)}
              onClick={() => navigate({ to: "/deed/$state", params: { state: s.code } })}
              title={`${s.name} · ${LABEL[s.status]}`}
              aria-label={`${s.name} — ${LABEL[s.status]}. Start a deed.`}
              className={`absolute rounded-sm text-[11px] font-semibold transition-all hover:-translate-y-0.5 ${TONE[s.status]}`}
              style={{
                left: (s.col - 1) * (cell + gap),
                top: (s.row - 1) * (cell + gap),
                width: cell,
                height: cell,
              }}
            >
              {s.code}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-5 text-center text-xs uppercase tracking-widest text-muted-foreground">
        {hovered ? (
          <>
            <span className="font-semibold text-accent">{hovered.name}</span> ·{" "}
            {LABEL[hovered.status]} — click to start
          </>
        ) : (
          "Hover a tile for status — click any state to start a deed file"
        )}
      </p>
    </div>
  );
}

export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-6 py-6 text-xs uppercase tracking-widest text-muted-foreground">
      <span className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-sm bg-accent" /> Live
      </span>
      <span className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-sm bg-primary/15" /> Beta
      </span>
      <span className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-sm bg-primary/5" /> Coming soon
      </span>
    </div>
  );
}