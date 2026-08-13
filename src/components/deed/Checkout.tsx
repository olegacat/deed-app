import { useEffect, useState } from "react";
import { Check, Lock, Mail, ShieldCheck, User } from "lucide-react";
import type { StateInfo } from "@/data/states";
import { Field, SectionHeader } from "./IntakeForm";
import { signInWithGoogle, signInWithPassword, signUpWithPassword, signOut, useSession } from "@/lib/session";
import { PaywallDialog } from "./PaywallDialog";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export interface CheckoutData {
  plan: "single" | "monthly";
  email: string;
  phone: string;
  firm: string;
  emailCopy: boolean;
  saveToAccount: boolean;
  authMode: "create" | "signin";
  password: string;
  provider: "password" | "google" | null;
  signedIn: boolean;
  cardName: string;
  cardNumber: string;
  cardExp: string;
  cardCvc: string;
}

export const emptyCheckout = (): CheckoutData => ({
  plan: "single",
  email: "",
  phone: "",
  firm: "",
  emailCopy: true,
  saveToAccount: true,
  authMode: "create",
  password: "",
  provider: null,
  signedIn: false,
  cardName: "",
  cardNumber: "",
  cardExp: "",
  cardCvc: "",
});

const inputCls =
  "mt-1.5 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-accent/50 focus:border-ring focus:ring-2 focus:ring-ring/25";

import { CHECKOUT_PLANS } from "@/lib/checkout-plans";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className={`text-xs ${strong ? "font-bold text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
      <span
        className={`tabular-nums ${strong ? "font-display text-2xl text-foreground" : "text-sm text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function Checkout({
  state,
  data,
  set,
  onBack,
  onPaid,
}: {
  state: StateInfo;
  data: CheckoutData;
  set: <K extends keyof CheckoutData>(k: K, v: CheckoutData[K]) => void;
  onBack: () => void;
  onPaid: () => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const session = useSession();
  const plan = CHECKOUT_PLANS[data.plan];

  const emailOk = /.+@.+\..+/.test(data.email);
  const canPay = emailOk && (!data.saveToAccount || data.signedIn || data.password.length >= 6);

  const pay = () => setPaywallOpen(true);

  // Stripe returns to this page with ?checkout=success after payment.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;
    setProcessing(true);
    window.history.replaceState({}, "", window.location.pathname);
    setPaywallOpen(false);
    setProcessing(false);
    onPaid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect a live session (e.g. after Google sign-in or email confirmation).
  useEffect(() => {
    if (session.user && !data.signedIn) {
      set("signedIn", true);
      set("provider", session.user.provider);
      if (!data.email) set("email", session.user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.user]);

  return (
    <>
    <PaymentTestModeBanner />
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <div className="space-y-8 rounded-sm border border-border bg-card p-6 lg:p-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">Step 03</p>
          <h2 className="mt-2 font-display text-4xl leading-none text-foreground">
            Checkout<span className="text-accent">.</span>
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Choose a plan and pay securely via Stripe to unlock the {state.name} deed package —
            draft deed, transfer-tax worksheet, and PDF export.
          </p>
        </div>

        {/* Plan */}
        <section className="space-y-4">
          <SectionHeader step="A" title="Choose a plan" />
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(CHECKOUT_PLANS) as Array<keyof typeof CHECKOUT_PLANS>).map((key) => {
              const p = CHECKOUT_PLANS[key];
              const active = data.plan === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => set("plan", key)}
                  className={`rounded-sm border p-4 text-left transition-colors ${
                    active
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "border-input bg-card hover:border-accent/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">
                      {p.label}
                    </span>
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        active ? "border-accent bg-accent text-accent-foreground" : "border-input"
                      }`}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-3xl leading-none text-foreground">
                    {p.displayPrice}
                    <span className="ml-1.5 text-[11px] font-normal tracking-wide text-muted-foreground">
                      {p.cadence}
                    </span>
                  </p>
                  <p className="mt-2 text-[12px] text-muted-foreground">{p.blurb}</p>
                  <ul className="mt-3 space-y-1">
                    {p.perks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-start gap-1.5 text-[11.5px] leading-snug text-muted-foreground"
                      >
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </section>

        {/* Contact */}
        <section className="space-y-4">
          <SectionHeader step="B" title="Where should the deed go?" note="Delivery contact" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" hint="The package PDF is sent here.">
              <input
                className={inputCls}
                type="email"
                placeholder="you@firm.com"
                value={data.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                className={inputCls}
                placeholder="(203) 555-0142"
                value={data.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Firm / company (optional)">
                <input
                  className={inputCls}
                  placeholder="Hartwell & Reed LLP"
                  value={data.firm}
                  onChange={(e) => set("firm", e.target.value)}
                />
              </Field>
            </div>
          </div>
          <label className="flex items-start gap-3 rounded-sm border border-input bg-secondary/40 p-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-accent"
              checked={data.emailCopy}
              onChange={(e) => set("emailCopy", e.target.checked)}
            />
            <span className="text-[12.5px] leading-snug text-foreground">
              Email me the deed package
              <span className="block text-[11px] text-muted-foreground">
                Prototype: nothing is actually sent.
              </span>
            </span>
          </label>
        </section>

        {/* Account */}
        <section className="space-y-4">
          <SectionHeader step="C" title="Save deeds to an account" note="Optional" />
          <label className="flex items-start gap-3 rounded-sm border border-input bg-secondary/40 p-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-accent"
              checked={data.saveToAccount}
              onChange={(e) => set("saveToAccount", e.target.checked)}
            />
            <span className="text-[12.5px] leading-snug text-foreground">
              Keep this matter in my Deed Copilot account
              <span className="block text-[11px] text-muted-foreground">
                Lets you reopen the package later from any device.
              </span>
            </span>
          </label>

          {data.saveToAccount &&
            (data.signedIn ? (
              <div className="flex items-center gap-3 rounded-sm border border-success/40 bg-success/10 p-3">
                <ShieldCheck className="h-4 w-4 text-success" />
                <p className="text-[12.5px] text-foreground">
                  Signed in as <span className="font-semibold">{data.email || "you"}</span>
                  {data.provider === "google" && " via Google"}.
                  <button
                    type="button"
                    onClick={() => {
                      set("signedIn", false);
                      signOut();
                      set("provider", null);
                    }}
                    className="ml-2 text-[11px] font-bold uppercase tracking-[0.14em] text-accent underline-offset-4 hover:underline"
                  >
                    Sign out
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-4 rounded-sm border border-input p-4">
                <div className="grid grid-cols-2 gap-2">
                  {(["create", "signin"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set("authMode", m)}
                      className={`rounded-sm border px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
                        data.authMode === m
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-input bg-card text-foreground hover:bg-secondary"
                      }`}
                    >
                      {m === "create" ? "Create account" : "Sign in"}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await signInWithGoogle();
                    if (res.ok) {
                      set("provider", "google");
                      set("signedIn", true);
                    }
                  }}
                  className="flex w-full items-center justify-center gap-2.5 rounded-sm border border-input bg-card px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <GoogleMark />
                  Continue with Google
                </button>

                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    or email
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Account email">
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        className={`${inputCls} mt-0 pl-9`}
                        type="email"
                        placeholder="you@firm.com"
                        value={data.email}
                        onChange={(e) => set("email", e.target.value)}
                      />
                    </div>
                  </Field>
                  <Field label="Password" hint="At least 6 characters.">
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        className={`${inputCls} mt-0 pl-9`}
                        type="password"
                        placeholder="••••••••"
                        value={data.password}
                        onChange={(e) => set("password", e.target.value)}
                      />
                    </div>
                  </Field>
                </div>

                <button
                  type="button"
                  disabled={!emailOk || data.password.length < 6 || authBusy}
                  onClick={async () => {
                    setAuthError(null);
                    setAuthNotice(null);
                    setAuthBusy(true);
                    const res =
                      data.authMode === "create"
                        ? await signUpWithPassword(data.email, data.password, { firm: data.firm })
                        : await signInWithPassword(data.email, data.password);
                    setAuthBusy(false);
                    if (!res.ok) {
                      setAuthError(res.error ?? "Something went wrong. Please try again.");
                      return;
                    }
                    if (res.needsConfirmation) {
                      setAuthNotice(
                        "Account created. Check your inbox to confirm your email, then sign in.",
                      );
                      set("authMode", "signin");
                      return;
                    }
                    set("provider", "password");
                    set("signedIn", true);
                  }}
                  className="w-full rounded-sm border border-accent bg-accent px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-accent-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <User className="mr-1.5 inline h-3.5 w-3.5" />
                  {authBusy
                    ? "Working…"
                    : data.authMode === "create"
                      ? "Create account"
                      : "Sign in"}
                </button>
                {authError ? (
                  <p className="text-[12px] leading-snug text-destructive">{authError}</p>
                ) : null}
                {authNotice ? (
                  <p className="text-[12px] leading-snug text-success">{authNotice}</p>
                ) : null}
              </div>
            ))}
        </section>

        {/* Payment */}
        <section className="space-y-4">
          <SectionHeader step="D" title="Payment details" note="Test mode" />
          <div className="flex items-start gap-3 rounded-sm border border-input bg-secondary/40 p-4">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-[12.5px] leading-snug text-foreground">
              Card details are collected in a secure payment window.
              <span className="block text-[11px] text-muted-foreground">
                Click “Pay {plan.displayPrice}” below to open it. Test mode card: 4242 4242 4242 4242.
              </span>
            </p>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <button
            type="button"
            onClick={onBack}
            className="rounded-sm border border-input px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-secondary"
          >
            ← Back to intake
          </button>
          <button
            type="button"
            onClick={pay}
            disabled={!canPay || processing}
            className="rounded-sm border border-accent bg-accent px-6 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {processing ? "Processing…" : `Pay ${plan.displayPrice} & generate deed`}
          </button>
          {!emailOk && (
            <span className="text-[11px] text-muted-foreground">Add a valid email to continue.</span>
          )}
        </div>
      </div>

      <aside className="h-fit space-y-5 rounded-sm border border-border bg-card p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Order summary
        </p>
        <h3 className="font-display text-2xl leading-tight text-foreground">
          {state.name} deed package
        </h3>
        <div className="divide-y divide-border border-y border-border">
          <Row label={plan.label} value={plan.displayPrice} />
          <Row label="Recording fees (paid at county)" value="Not included" />
          <Row label="Transfer tax (paid at closing)" value="Not included" />
          <Row label={`Total due ${plan.cadence}`} value={plan.displayPrice} strong />
        </div>
        <ul className="space-y-2 text-[12px] leading-relaxed text-muted-foreground">
          <li className="flex gap-2">
            <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            {data.emailCopy
              ? `PDF copy to ${data.email || "your email"}`
              : "No email copy requested"}
          </li>
          <li className="flex gap-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            {data.saveToAccount ? "Saved to your account" : "Not saved to an account"}
          </li>
        </ul>
        <div className="rounded-sm bg-sidebar p-4 text-sidebar-foreground">
          <p className="font-display text-lg italic leading-tight">Secure checkout</p>
          <p className="mt-2 text-[11.5px] leading-relaxed text-sidebar-foreground/70">
            Card details are handled by Stripe. Drafts remain illustrative — for attorney and title
            review before recording.
          </p>
        </div>
      </aside>
    </div>
    <PaywallDialog
      open={paywallOpen}
      plan={data.plan}
      title={`${plan.label} — ${plan.displayPrice}`}
      {...(data.email ? { email: data.email } : {})}
      {...(session.user?.id ? { userId: session.user.id } : {})}
      onClose={() => setPaywallOpen(false)}
    />
    </>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.8 6.1C12.3 13.9 17.6 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.2 7.1-17.4z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.1a14.6 14.6 0 0 1 0-9.2l-7.8-6.1a24 24 0 0 0 0 21.4l7.8-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 47.5c6.2 0 11.5-2 15.4-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.8 2.3-6.4 0-11.7-4.4-13.6-10.2l-7.8 6.1C6.5 42.1 14.6 47.5 24 47.5z"
      />
    </svg>
  );
}
