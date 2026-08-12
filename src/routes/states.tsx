import { createFileRoute, Link } from "@tanstack/react-router";
import { STATES } from "@/data/states";
import { Pill, SideRail } from "@/components/deed/Chrome";
import { ProfileRail } from "@/components/deed/ProfileRail";
import { StateMap } from "@/components/deed/StateMap";

const TITLE = "Deed Copilot — evidence-backed deed & recording-doc prep";
const DESC =
  "Prototype deed and transfer-tax preparation for attorneys and paralegals: 50 states + DC, verified rates in ten states plus a NYC/ACRIS module.";

export const Route = createFileRoute("/states")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Index,
});

function Index() {
  const liveStates = STATES.filter((s) => s.status === "live" && s.card);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      <SideRail
        eyebrow="50 states + DC · NYC / ACRIS"
        title="Pick your"
        italic="state."
        body="Evidence-backed deed and recording-document prep. Every field traced to its source, every draft built for attorney review."
      />

      <main className="flex-1 p-6 md:p-12 lg:p-16">
        <div className="no-print mb-10 flex justify-end">
          <ProfileRail placement="header" />
        </div>
        <section className="mb-20">
          <h2 className="mb-8 flex items-center gap-4 font-display text-3xl">
            The jurisdiction map
            <span className="h-px flex-1 bg-border" />
          </h2>
          <StateMap />
        </section>

        <section className="mb-20">
          <h2 className="mb-8 flex items-center gap-4 font-display text-3xl">
            Available jurisdictions
            <span className="h-px flex-1 bg-border" />
          </h2>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {liveStates.map((s) => (
              <Link
                key={s.code}
                to="/deed/$state"
                params={{ state: s.code }}
                className="group flex flex-col border border-border bg-card p-7 transition-all hover:border-accent hover:shadow-xl"
              >
                <div className="mb-6 flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center bg-primary text-sm font-bold text-primary-foreground">
                    {s.code}
                  </span>
                  <Pill tone="live">{s.card!.badge}</Pill>
                </div>
                <h3 className="mb-2 font-display text-2xl text-foreground">{s.name}</h3>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  {s.card!.summary}
                </p>
                <span className="mt-8 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent transition-all group-hover:gap-4">
                  Start a deed <span className="text-lg leading-none">→</span>
                </span>
              </Link>
            ))}

            <div className="flex flex-col border border-dashed border-border bg-secondary/40 p-7">
              <div className="mb-6 flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center border border-border text-sm font-bold text-muted-foreground">
                  US
                </span>
                <Pill tone="beta">Beta</Pill>
              </div>
              <h3 className="mb-2 font-display text-2xl text-foreground">Every other state</h3>
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                Beta jurisdictions get the same deed generator and a transfer-tax engine running on
                research-grade rates not yet verified against the state's official schedule.
              </p>
              <span className="mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Pick a tile on the map
              </span>
            </div>
          </div>
        </section>

        <footer className="border-t border-border pt-10">
          <p className="max-w-2xl text-xs font-light leading-loose text-muted-foreground">
            Deed Copilot is a prototype for attorney and title review. It is not a law firm, does
            not provide legal advice, and its output is illustrative — not recording-ready. All
            documents must be reviewed by a licensed professional in the relevant jurisdiction.
          </p>
        </footer>
      </main>
    </div>
  );
}
