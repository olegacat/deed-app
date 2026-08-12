import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardList,
  Clock,
  FileSearch,
  FileWarning,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { STATES } from "@/data/states";

const TITLE = "Deed Copilot — evidence-backed deed & recording prep for law firms";
const DESC =
  "Deed prep that shows its work: pull public county records, review an evidence checklist, and download a review-ready deed package. Ten live states plus NYC/ACRIS.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#coverage", label: "Coverage" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const PROBLEMS = [
  {
    icon: FileSearch,
    title: "County research eats the morning",
    body: "Every jurisdiction hides its parcel data, transfer-tax schedule and cover-sheet rules somewhere different. You learn each one by hand, again, per matter.",
  },
  {
    icon: FileWarning,
    title: "One wrong fact is a liability event",
    body: "A stale legal description or a missed local surtax comes back as a rejected recording — or worse, a claim. The risk sits with the signing attorney.",
  },
  {
    icon: Clock,
    title: "45–90 minutes per deed, every deed",
    body: "Retyping the same grantor, parcel and consideration across a deed, a transfer-tax return and two affidavits is work no one bills happily.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Enter the address",
    body: "Pick the state and county, drop in the street address or the parcel/folio number. Nothing else required to start.",
  },
  {
    n: "02",
    title: "We pull the public record",
    body: "Open county and state property data is queried live where the jurisdiction publishes it — owner of record, parcel ID, assessment.",
  },
  {
    n: "03",
    title: "Review the evidence checklist",
    body: "Every field is labelled Confirmed, Verify, Provide or Flagged, so the human check lands exactly where it matters.",
  },
  {
    n: "04",
    title: "Download the package",
    body: "Draft deed, transfer-tax computation and the jurisdiction's recording forms — one bundle, ready for attorney review.",
  },
];

const EVIDENCE = [
  {
    tag: "Confirmed",
    tone: "border-success/40 bg-success/10 text-success",
    body: "Pulled straight from the county or state record and matched to your input. Cite-able.",
  },
  {
    tag: "Verify",
    tone: "border-warning/50 bg-warning/15 text-warning-foreground",
    body: "Present in the data, but must be read against the recorded deed before signature.",
  },
  {
    tag: "Provide",
    tone: "border-info/40 bg-info/10 text-info",
    body: "Not public anywhere — grantee vesting, consideration, preparer block. You supply it.",
  },
  {
    tag: "Flagged",
    tone: "border-destructive/40 bg-destructive/10 text-destructive",
    body: "A compliance condition triggered by the numbers: mansion tax, surtax, non-resident withholding.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$49",
    unit: "per deed",
    body: "Single matter, full package, no subscription.",
    features: ["One deed package", "All live jurisdictions", "Evidence checklist", "PDF export"],
  },
  {
    name: "Professional",
    price: "$149",
    unit: "per month",
    featured: true,
    body: "For the solo attorney or paralegal running deeds weekly.",
    features: ["Unlimited deed packages", "Saved matter library", "Priority jurisdiction data", "Email delivery"],
  },
  {
    name: "Firm",
    price: "Talk to us",
    unit: "seats & volume",
    body: "Shared matter library across the practice.",
    features: ["Multiple seats, one account", "Firm-wide templates", "Onboarding for new states", "Named support"],
  },
];

const FAQ = [
  {
    q: "Is this legal advice?",
    a: "No. Deed Copilot is a document-preparation tool. It is not a law firm and does not provide legal advice or an attorney-client relationship.",
  },
  {
    q: "Is the output recording-ready?",
    a: "No. Every package is a draft. A licensed attorney or title professional in the relevant jurisdiction must review it — and sign off on it — before recording.",
  },
  {
    q: "Which states are fully live?",
    a: "Ten states plus a dedicated NYC/ACRIS module have rates and forms verified against the official schedules. Every other state runs the same engine on research-grade rates and is marked beta in-app.",
  },
  {
    q: "Can my whole firm use one account?",
    a: "The Firm tier is built for that: multiple seats sharing one matter library, with firm-wide preparer blocks and templates.",
  },
  {
    q: "Where does the data come from?",
    a: "Public county and state property records — Socrata and ArcGIS open-data endpoints where the jurisdiction publishes them. Each state's sources are listed on the Data & Disclaimers page.",
  },
];

function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
          {eyebrow}
        </p>
        <h2 className="max-w-3xl font-display text-4xl leading-[1.05] text-foreground lg:text-5xl">
          {title}
        </h2>
        {lead && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">{lead}</p>
        )}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

function Landing() {
  const live = STATES.filter((s) => s.status === "live");
  const [open, setOpen] = useState<number | null>(0);
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1 — Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent text-sm font-bold text-accent-foreground">
              D
            </span>
            <span className="font-display text-xl tracking-tight">
              Deed Copilot<sup className="ml-0.5 text-[10px] align-super">™</sup>
            </span>
          </Link>
          <div className="ml-auto hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </div>
          <Link
            to="/states"
            className="ml-auto inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-foreground transition-all hover:bg-accent md:ml-0"
          >
            Try a deed <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </header>

      {/* 2 — Hero */}
      <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
        <div className="mx-auto grid max-w-6xl gap-16 px-6 py-24 lg:grid-cols-[1.05fr_0.95fr] lg:py-32">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-sidebar-border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-sidebar-foreground/60">
              <Sparkles className="h-3 w-3 text-accent" /> 10 states + NYC / ACRIS live
            </p>
            <h1 className="font-display text-5xl leading-[0.95] lg:text-7xl">
              Deed prep that
              <br />
              <span className="italic text-accent">shows its work.</span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-sidebar-foreground/70">
              Built for law firms and title companies. Every field in the package is traced to a
              public record or flagged for a human — so you know what's verified before you sign,
              not after the recorder rejects it.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/states"
                className="inline-flex items-center gap-2 rounded-sm bg-accent px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-foreground transition-all hover:brightness-110"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-sm border border-sidebar-border px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/80 transition-colors hover:border-accent hover:text-accent"
              >
                See how it works
              </a>
            </div>
            <p className="mt-5 text-xs text-sidebar-foreground/45">
              No card required to try · Draft output for attorney review
            </p>
          </div>

          {/* hero visual: deed + evidence layer + source data */}
          <div className="relative hidden lg:block">
            <div className="absolute right-8 top-4 w-[86%] rotate-[-3deg] border border-sidebar-border bg-sidebar-accent/60 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sidebar-foreground/40">
                Source data · county record
              </p>
              <div className="mt-4 space-y-2">
                {["Parcel 3021-0044", "Owner of record", "Assessment 2026"].map((t) => (
                  <div key={t} className="h-2.5 w-full bg-sidebar-foreground/10" title={t} />
                ))}
              </div>
            </div>
            <div className="absolute right-0 top-24 w-[86%] rotate-[1.5deg] border border-accent/40 bg-sidebar-accent p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                Evidence layer
              </p>
              <div className="mt-4 space-y-2.5">
                {EVIDENCE.map((e) => (
                  <div key={e.tag} className="flex items-center gap-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] ${e.tone}`}
                    >
                      {e.tag}
                    </span>
                    <span className="h-2 flex-1 bg-sidebar-foreground/10" />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute right-14 top-[19rem] w-[80%] border border-border bg-card p-7 text-foreground shadow-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Draft deed · for review
              </p>
              <p className="mt-3 font-display text-2xl leading-tight">Bargain and Sale Deed</p>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full bg-secondary" />
                <div className="h-2 w-11/12 bg-secondary" />
                <div className="h-2 w-9/12 bg-secondary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 — Problem */}
      <Section
        eyebrow="The problem"
        title="The deed isn't the hard part. Proving the facts behind it is."
        lead="Ask any paralegal what a transfer really costs in time — it's the research, the double-checking, and the quiet dread of a fact that didn't get verified."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {PROBLEMS.map((p) => (
            <article key={p.title} className="border border-border bg-card p-8">
              <p.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-6 font-display text-2xl leading-tight">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* 4 — How it works */}
      <Section
        id="how-it-works"
        eyebrow="How it works"
        title="Four steps from address to review-ready package."
      >
        <ol className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="bg-card p-8">
              <span className="font-display text-4xl text-accent">{s.n}</span>
              <h3 className="mt-5 text-sm font-bold uppercase tracking-[0.16em]">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* 5 — Coverage */}
      <Section
        id="coverage"
        eyebrow="Coverage"
        title="Ten states verified. Everywhere else, honestly labelled."
        lead="In live jurisdictions the transfer-tax rates and recording forms are checked against the official state schedule. Beta states run the same engine on research-grade rates and say so, on screen, every time."
      >
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 xl:grid-cols-3">
            {live.map((s) => (
              <Link
                key={s.code}
                to="/deed/$state"
                params={{ state: s.code }}
                className="group flex items-center gap-4 bg-card p-5 transition-colors hover:bg-secondary"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
                  {s.code}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{s.name}</span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                    Live
                  </span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
          <aside className="border border-dashed border-border bg-secondary/40 p-8">
            <MapPin className="h-6 w-6 text-muted-foreground" />
            <h3 className="mt-6 font-display text-2xl">Every other state — beta</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              All 50 states and DC are in the app. Outside the live list, transfer-tax rates are
              research-grade — not yet verified against the state's official schedule — and every
              package is badged accordingly so nothing is mistaken for a confirmed figure.
            </p>
            <Link
              to="/states"
              className="mt-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent"
            >
              Open the jurisdiction map <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </aside>
        </div>
      </Section>

      {/* 6 — Evidence layer */}
      <section className="border-t border-border bg-sidebar py-20 text-sidebar-foreground lg:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
            The evidence layer
          </p>
          <h2 className="max-w-3xl font-display text-4xl leading-[1.05] lg:text-5xl">
            Know exactly what's verified — and what still needs a human check.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-sidebar-foreground/65">
            Other tools hand you a finished-looking document and leave you to guess which parts to
            trust. Deed Copilot marks every fact with its provenance, so review is a checklist
            instead of a re-do.
          </p>

          <div className="mt-12 grid gap-px overflow-hidden border border-sidebar-border bg-sidebar-border md:grid-cols-2 xl:grid-cols-4">
            {EVIDENCE.map((e) => (
              <div key={e.tag} className="bg-sidebar p-8">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${e.tone}`}
                >
                  {e.tag}
                </span>
                <p className="mt-5 text-sm leading-relaxed text-sidebar-foreground/70">{e.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-8 text-xs uppercase tracking-[0.18em] text-sidebar-foreground/50">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" /> Public-record citations
            </span>
            <span className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-accent" /> Compliance flags per jurisdiction
            </span>
          </div>
        </div>
      </section>

      {/* 7 — Pricing */}
      <Section
        id="pricing"
        eyebrow="Pricing"
        title="Priced per deed, or per month when deeds are the routine."
        lead="No card required to try — build a full package and see the evidence checklist before you pay."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <article
              key={p.name}
              className={`flex flex-col border p-8 ${
                p.featured ? "border-accent bg-card shadow-xl" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {p.name}
                </h3>
                {p.featured && (
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                    Most firms
                  </span>
                )}
              </div>
              <p className="mt-5 font-display text-5xl leading-none">{p.price}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {p.unit}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/states"
                className={`mt-8 inline-flex items-center justify-center gap-2 rounded-sm px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] transition-all ${
                  p.featured
                    ? "bg-accent text-accent-foreground hover:brightness-110"
                    : "border border-border text-foreground hover:border-accent hover:text-accent"
                }`}
              >
                Start free
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Full plan comparison and volume terms live on the pricing page — currently in preparation.
        </p>
      </Section>

      {/* 8 — FAQ */}
      <Section id="faq" eyebrow="FAQ" title="The questions counsel asks first.">
        <div className="max-w-3xl divide-y divide-border border-y border-border">
          {FAQ.map((f, i) => (
            <div key={f.q}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full items-center gap-6 py-6 text-left"
              >
                <span className="flex-1 font-display text-2xl leading-tight">{f.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-accent transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <p className="-mt-1 max-w-2xl pb-7 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* 9 — Final CTA */}
      <section className="border-t border-border bg-primary py-24 text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="max-w-2xl font-display text-4xl leading-[1.05] lg:text-5xl">
            Prepare the deed once — with the evidence attached.
          </h2>
          <Link
            to="/states"
            className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-accent px-8 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-foreground transition-all hover:brightness-110"
          >
            Try a deed <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 10 — Footer */}
      <footer className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent text-xs font-bold text-accent-foreground">
                  D
                </span>
                <span className="font-display text-lg">
                  Deed Copilot<sup className="ml-0.5 text-[9px] align-super">™</sup>
                </span>
              </div>
              <p className="mt-5 max-w-sm text-xs leading-loose text-sidebar-foreground/60">
                Deed Copilot is a document-preparation tool, not a law firm, and does not provide
                legal advice. Output is a draft for review by a licensed attorney or title
                professional prior to recording.
              </p>
              <p className="mt-4 text-xs leading-loose text-sidebar-foreground/45">
                Powered in part by public county and state property records.
              </p>
            </div>

            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-sidebar-foreground/40">
                Product
              </p>
              <ul className="space-y-2.5 text-sm text-sidebar-foreground/70">
                <li>
                  <Link to="/states" className="hover:text-accent">
                    Start a deed
                  </Link>
                </li>
                <li>
                  <a href="#coverage" className="hover:text-accent">
                    Coverage
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-accent">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-accent">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-sidebar-foreground/40">
                Legal
              </p>
              <ul className="space-y-2.5 text-sm text-sidebar-foreground/70">
                <li>
                  <a href="#faq" className="hover:text-accent">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-accent">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-accent">
                    Data &amp; Disclaimers
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-3 border-t border-sidebar-border pt-8 text-xs text-sidebar-foreground/45 md:flex-row md:items-center md:justify-between">
            <p>© {year} Deed Copilot. All rights reserved.</p>
            <p>Attorney Advertising — applicability under review by counsel.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}