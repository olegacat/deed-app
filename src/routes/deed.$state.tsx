import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { defaultCounty, findState } from "@/data/states";
import { useTaxSummary } from "@/hooks/use-tax-summary";
import { Link } from "@tanstack/react-router";
import {
  checkoutStep,
  isNYExtendedFlow,
  packageStep,
} from "@/lib/jurisdiction-config";
import { getIntakeProfile } from "@/lib/intake-profiles";
import {
  hasLiveLookup,
  lookupParcels,
  parcelToFormFields,
  type ParcelRecord,
} from "@/lib/parcel-lookup";
import {
  draftHasProgress,
  loadLocalDraft,
  newDraftId,
  persistableCheckout,
  saveLocalDraft,
  type DeedWizardSnapshot,
} from "@/lib/deed-draft";
import {
  loadDeedById,
  loadLatestDeedForState,
  upsertDeedDraft,
  useSession,
  type SavedDeed,
} from "@/lib/session";

import { emptyForm, IntakeForm, type DeedForm } from "@/components/deed/IntakeForm";
import { Checkout, emptyCheckout, type CheckoutData } from "@/components/deed/Checkout";
import { PackageView } from "@/components/deed/Package";
import { ExtractStep } from "@/components/deed/Extract";
import { EvidenceStep } from "@/components/deed/Evidence";
import { ProfileRail } from "@/components/deed/ProfileRail";
import { SellingPoints } from "@/components/deed/SellingPoints";
import { ProgressSteps, ProgressViewSwitcher } from "@/components/deed/ProgressSteps";

function checkoutFromSaved(data: SavedDeed["checkout"] | DeedWizardSnapshot["checkout"]): CheckoutData {
  return { ...emptyCheckout(), ...data, password: "" };
}

export const Route = createFileRoute("/deed/$state")({
  validateSearch: (search: Record<string, unknown>) => ({
    draft: typeof search.draft === "string" ? search.draft : undefined,
    checkout: typeof search.checkout === "string" ? search.checkout : undefined,
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: ({ params }) => {
    const s = findState(params.state);
    const title = `${s?.name ?? "State"} deed prep — Deed Copilot`;
    const desc = `Prototype intake and recording package for ${s?.name ?? "your state"}: transfer-tax computation, required forms and a draft deed for attorney review.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: DeedWizard,
});

function applySaved(
  deed: SavedDeed,
  pkgStep: number,
  setDraftId: (id: string) => void,
  setters: {
    setStep: (n: number) => void;
    setForm: (f: DeedForm) => void;
    setCheckout: (c: CheckoutData) => void;
    setParcelUsed: (v: boolean) => void;
  },
) {
  setDraftId(deed.id);
  setters.setStep(deed.status === "paid" ? pkgStep : deed.step);
  if (deed.form) setters.setForm(deed.form);
  if (deed.checkout) setters.setCheckout(checkoutFromSaved(deed.checkout));
  setters.setParcelUsed(deed.parcelUsed);
}

function DeedWizard() {
  const { state: code } = Route.useParams();
  const navigate = useNavigate();
  const session = useSession();
  const state = findState(code);
  const nyFlow = state ? isNYExtendedFlow(state.code) : false;

  const [draftId, setDraftId] = useState(() => newDraftId());
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<DeedForm>(() =>
    emptyForm(defaultCounty(state?.code ?? "", state?.counties ?? []), state?.code),
  );
  const [checkout, setCheckout] = useState<CheckoutData>(() => emptyCheckout());
  const [parcelUsed, setParcelUsed] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState<ParcelRecord[]>([]);
  const [progressView, setProgressView] = useState<"rail" | "top">("rail");
  const dbHydratedRef = useRef<string | null>(null);
  const startFreshRef = useRef(false);

  const tax = useTaxSummary({
    stateCode: state?.code ?? "",
    county: form.county,
    consideration: Number(form.consideration || 0),
    nominal: form.nominal,
    singleFamily: form.singleFamily,
  });

  const payStep = checkoutStep(code);
  const pkgStep = packageStep(code);

  // Restore local draft (and Stripe return) before any writes.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutOk = params.get("checkout") === "success";
    const urlDraft = params.get("draft");
    if (urlDraft) {
      if (checkoutOk) window.history.replaceState({}, "", `${window.location.pathname}?draft=${urlDraft}`);
      setHydrated(true);
      return;
    }
    const local = loadLocalDraft(code);
    if (local) {
      startFreshRef.current = Boolean(local.startFresh);
      setDraftId(local.id);
      setForm(local.form);
      setCheckout(checkoutFromSaved(local.checkout));
      setParcelUsed(local.parcelUsed);
      setStep(checkoutOk ? pkgStep : local.step);
    } else if (checkoutOk) {
      setStep(pkgStep);
    }
    if (checkoutOk) window.history.replaceState({}, "", window.location.pathname);
    setHydrated(true);
  }, [code, pkgStep]);

  // After sign-in: resume a specific ?draft= row, or the latest deed for this state.
  useEffect(() => {
    if (!hydrated || session.loading || !session.user) return;
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const urlDraft = params?.get("draft");
    const key = `${session.user.id}:${urlDraft ?? "latest"}:${code}`;
    if (dbHydratedRef.current === key) return;
    dbHydratedRef.current = key;

    const local = loadLocalDraft(code);
    void (async () => {
      if (urlDraft) {
        startFreshRef.current = false;
        const row = await loadDeedById(urlDraft);
        if (row && row.stateCode.toUpperCase() === code.toUpperCase()) {
          applySaved(row, pkgStep, setDraftId, { setStep, setForm, setCheckout, setParcelUsed });
        }
        return;
      }
      if (startFreshRef.current || local?.startFresh) return;
      if (local && draftHasProgress(local)) return;
      const row = await loadLatestDeedForState(code);
      if (row) applySaved(row, pkgStep, setDraftId, { setStep, setForm, setCheckout, setParcelUsed });
    })();
  }, [hydrated, session.loading, session.user, code]);

  useEffect(() => {
    if (!hydrated || !state) return;
    const alreadyPaid = session.deeds.some((d) => d.id === draftId && d.status === "paid");
    const snapshot: DeedWizardSnapshot = {
      id: draftId,
      step,
      form,
      checkout: persistableCheckout(checkout),
      parcelUsed,
      status: alreadyPaid || step >= pkgStep ? "paid" : "draft",
      startFresh: startFreshRef.current,
    };
    saveLocalDraft(code, snapshot);
    if (!session.user || !draftHasProgress(snapshot)) return;
    const t = window.setTimeout(() => {
      void upsertDeedDraft({
        id: snapshot.id,
        stateCode: state.code,
        stateName: state.name,
        form: snapshot.form,
        checkout: snapshot.checkout,
        step: snapshot.step,
        parcelUsed: snapshot.parcelUsed,
        status: snapshot.status,
      });
    }, 450);
    return () => window.clearTimeout(t);
  }, [hydrated, code, draftId, step, form, checkout, parcelUsed, pkgStep, session.user, state]);

  if (!state) return <Navigate to="/states" />;

  const set = <K extends keyof DeedForm>(k: K, v: DeedForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setCheckoutField = <K extends keyof CheckoutData>(k: K, v: CheckoutData[K]) =>
    setCheckout((c) => ({ ...c, [k]: v }));

  const applyParcel = (p: ParcelRecord) => {
    const fields = parcelToFormFields(p);
    setForm((f) => ({ ...f, ...fields }));
    setParcelUsed(true);
    setLookupResults([]);
    setLookupStatus(`Loaded from ${p.dataProvider}.`);
  };

  const onLookup = async () => {
    setLookupResults([]);
    if (!hasLiveLookup(state.code)) {
      setLookupStatus(
        `No live parcel connector for ${state.name} yet — enter the parcel manually and continue.`,
      );
      return;
    }
    if (!form.street.trim()) {
      setLookupStatus("Enter a street name before running live lookup.");
      return;
    }

    setLookupLoading(true);
    setLookupStatus(`Querying ${state.openDataLabel ?? "open data"}…`);
    try {
      const results = await lookupParcels({
        stateCode: state.code,
        county: form.county,
        city: getIntakeProfile(state.code).showCity ? form.city : "",
        house: form.house,
        street: form.street,
      });
      if (results.length === 0) {
        const shortStreet = form.street.trim().length < 3;
        setLookupStatus(
          shortStreet
            ? `No parcels matched "${form.house} ${form.street}" in ${form.county}. Type more of the street name (e.g. North Dr, not N).`
            : "No parcels matched — check county, house number, and street spelling, or enter values manually.",
        );
        return;
      }
      if (results.length === 1) {
        applyParcel(results[0]!);
        return;
      }
      setLookupResults(results);
      setLookupStatus(`${results.length} parcels found — pick the correct one below.`);
    } catch (err) {
      setLookupStatus(
        err instanceof Error
          ? err.message
          : "Live lookup failed — enter values manually and continue.",
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const onBuild = () => {
    if (!parcelUsed) return;
    setStep(nyFlow ? 1 : payStep);
  };

  const fillMockIntake = () => {
    const mock = buildIntakeMock(state.code, form.county);
    setForm((f) => ({ ...f, ...mock.form }));
    setParcelUsed(true);
    setLookupStatus(mock.statusMessage);
    setLookupResults([]);
  };

  const startOver = () => {
    const nextId = newDraftId();
    const blank = emptyForm(defaultCounty(state.code, state.counties), state.code);
    const blankCheckout = emptyCheckout();
    startFreshRef.current = true;
    dbHydratedRef.current = session.user ? `${session.user.id}:fresh:${nextId}` : `anon:fresh:${nextId}`;
    setDraftId(nextId);
    setForm(blank);
    setCheckout(blankCheckout);
    setParcelUsed(false);
    setLookupStatus(null);
    setLookupResults([]);
    setStep(0);
    saveLocalDraft(state.code, {
      id: nextId,
      step: 0,
      form: blank,
      checkout: persistableCheckout(blankCheckout),
      parcelUsed: false,
      status: "draft",
      startFresh: true,
    });
    void navigate({
      to: "/deed/$state",
      params: { state: state.code },
      search: {},
      replace: true,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      <aside className="no-print flex w-full flex-col bg-sidebar p-8 text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-[340px] lg:w-[380px] lg:p-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent text-xs font-bold text-accent-foreground">
            D
          </div>
          <span className="text-lg font-medium tracking-tight">Deed Copilot</span>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/account/saved"
              className="rounded-full border border-sidebar-border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/70 transition-colors hover:border-accent hover:text-accent"
            >
              My packages
            </Link>
            <Link
              to="/states"
              className="rounded-full border border-sidebar-border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/70 transition-colors hover:border-accent hover:text-accent"
            >
              ← States
            </Link>
          </div>
        </div>

        <div className="mb-10">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-sidebar-foreground/40">
            {state.status === "live" ? "Verified jurisdiction" : "Beta jurisdiction"}
          </p>
          <h1 className="font-display text-5xl leading-[0.95]">
            {state.name}
            <span className="text-accent">.</span>
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-sidebar-foreground/70">
            {state.subtitle ?? `${state.counties.length} ${state.countyLabel}`}
          </p>
        </div>

        {progressView === "rail" && (
          <ProgressSteps variant="rail" stateCode={state.code} step={step} />
        )}

        <SellingPoints state={state} formulaCopy={tax.formulaCopy} verified={tax.verified} />

        <div className="mt-auto" />
      </aside>

      <main className="flex-1 p-6 md:p-10 lg:p-14">
        <div className="no-print mb-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={startOver}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Start over
          </button>
          <div className="flex items-center gap-3">
            <ProgressViewSwitcher value={progressView} onChange={setProgressView} />
            <ProfileRail placement="header" />
          </div>
        </div>
        {progressView === "top" && (
          <div className="no-print">
            <ProgressSteps variant="top" stateCode={state.code} step={step} />
          </div>
        )}

        {step === 0 && (
          <IntakeForm
            state={state}
            form={form}
            set={set}
            parcelUsed={parcelUsed}
            lookupStatus={lookupStatus}
            lookupLoading={lookupLoading}
            lookupResults={lookupResults}
            onUseParcel={() => {
              setParcelUsed(true);
              setLookupStatus(null);
              setLookupResults([]);
            }}
            onLookup={onLookup}
            onSelectParcel={applyParcel}
            onInvalidateParcel={() => {
              setParcelUsed(false);
              setLookupResults([]);
            }}
            onClear={startOver}
            onBuild={onBuild}
            onFillMock={fillMockIntake}
            onExit={() => navigate({ to: "/states" })}
          />
        )}

        {nyFlow && step === 1 && (
          <ExtractStep
            state={state}
            form={form}
            onDone={() => setStep(2)}
            onRestart={() => setStep(0)}
          />
        )}

        {nyFlow && step === 2 && (
          <EvidenceStep
            state={state}
            form={form}
            onBack={() => setStep(0)}
            onConfirm={() => setStep(payStep)}
            onRestart={() => setStep(0)}
          />
        )}

        {step === payStep && (
          <Checkout
            state={state}
            data={checkout}
            set={setCheckoutField}
            onBack={() => setStep(nyFlow ? 2 : 0)}
            onPaid={() => {
              setStep(pkgStep);
            }}
          />
        )}

        {step === pkgStep && (
          <div className="space-y-8">
            <PackageView state={state} form={form} />
            <button
              type="button"
              onClick={startOver}
              className="no-print inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Start over
            </button>
          </div>
        )}

        <footer className="mt-14 border-t border-border pt-10">
          <p className="max-w-2xl text-xs font-light leading-loose text-muted-foreground">
            Prototype for attorney/title review — illustrative drafts, not legal advice, not
            recording-ready.
          </p>
        </footer>
      </main>
    </div>
  );
}
