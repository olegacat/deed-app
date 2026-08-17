import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { defaultCounty, findState } from "@/data/states";
import { useTaxSummary } from "@/hooks/use-tax-summary";
import { Link } from "@tanstack/react-router";
import {
  checkoutStep,
  isNYExtendedFlow,
  packageStep,
} from "@/lib/jurisdiction-config";
import {
  hasLiveLookup,
  lookupParcels,
  parcelToFormFields,
  type ParcelRecord,
} from "@/lib/parcel-lookup";

import { emptyForm, IntakeForm, type DeedForm } from "@/components/deed/IntakeForm";
import { Checkout, emptyCheckout, type CheckoutData } from "@/components/deed/Checkout";
import { PackageView } from "@/components/deed/Package";
import { ExtractStep } from "@/components/deed/Extract";
import { EvidenceStep } from "@/components/deed/Evidence";
import { ProfileRail } from "@/components/deed/ProfileRail";
import { SellingPoints } from "@/components/deed/SellingPoints";
import { ProgressSteps, ProgressViewSwitcher } from "@/components/deed/ProgressSteps";

type WizardDraft = {
  form: DeedForm;
  checkout: CheckoutData;
  parcelUsed: boolean;
};

function wizardStorageKey(stateCode: string) {
  return `deed-wizard-${stateCode}`;
}

function loadWizardDraft(stateCode: string): WizardDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(wizardStorageKey(stateCode));
    return raw ? (JSON.parse(raw) as WizardDraft) : null;
  } catch {
    return null;
  }
}

function saveWizardDraft(stateCode: string, draft: WizardDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(wizardStorageKey(stateCode), JSON.stringify(draft));
}

function clearWizardDraft(stateCode: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(wizardStorageKey(stateCode));
}

export const Route = createFileRoute("/deed/$state")({
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

function DeedWizard() {
  const { state: code } = Route.useParams();
  const navigate = useNavigate();
  const state = findState(code);
  const nyFlow = state ? isNYExtendedFlow(state.code) : false;

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

  const tax = useTaxSummary({
    stateCode: state?.code ?? "",
    county: form.county,
    consideration: Number(form.consideration || 0),
    nominal: form.nominal,
    singleFamily: form.singleFamily,
  });

  const payStep = checkoutStep(code);
  const pkgStep = packageStep(code);

  // Restore wizard after Stripe redirect (full page reload drops React state).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;

    const draft = loadWizardDraft(code);
    if (draft) {
      setForm(draft.form);
      setCheckout(draft.checkout);
      setParcelUsed(draft.parcelUsed);
    }
    setStep(pkgStep);
    window.history.replaceState({}, "", window.location.pathname);
    clearWizardDraft(code);
  }, [code, pkgStep]);

  useEffect(() => {
    if (step < payStep) return;
    saveWizardDraft(code, { form, checkout, parcelUsed });
  }, [code, form, checkout, parcelUsed, step, payStep]);

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
        city: form.city,
        house: form.house,
        street: form.street,
      });
      if (results.length === 0) {
        setLookupStatus(
          "No parcels matched — check county, house number, and street spelling, or enter values manually.",
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

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      <aside className="no-print flex w-full flex-col bg-sidebar p-8 text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-[340px] lg:w-[380px] lg:p-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent text-xs font-bold text-accent-foreground">
            D
          </div>
          <span className="text-lg font-medium tracking-tight">Deed Copilot</span>
          <Link
            to="/states"
            className="ml-auto rounded-full border border-sidebar-border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/70 transition-colors hover:border-accent hover:text-accent"
          >
            ← States
          </Link>
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
        <div className="no-print mb-8 flex items-center justify-end gap-3">
          <ProgressViewSwitcher value={progressView} onChange={setProgressView} />
          <ProfileRail placement="header" />
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
            onClear={() => {
              setForm(emptyForm(defaultCounty(state.code, state.counties), state.code));
              setParcelUsed(false);
              setLookupStatus(null);
              setLookupResults([]);
            }}
            onBuild={onBuild}
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
              clearWizardDraft(state.code);
              setStep(pkgStep);
            }}
          />
        )}

        {step === pkgStep && (
          <PackageView state={state} form={form} />
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
