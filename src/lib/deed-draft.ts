import type { CheckoutData } from "@/components/deed/Checkout";
import { FALLBACK_PLAN_IDS } from "@/lib/checkout-plans";
import type { DeedForm } from "@/lib/deed-form.types";

export type DeedDraftStatus = "draft" | "paid";

export type PersistableCheckout = Pick<
  CheckoutData,
  "plan" | "email" | "phone" | "firm" | "emailCopy" | "saveToAccount" | "authMode"
>;

export type DeedWizardSnapshot = {
  id: string;
  step: number;
  form: DeedForm;
  checkout: PersistableCheckout;
  parcelUsed: boolean;
  status: DeedDraftStatus;
  /** Local-only: skip auto-resuming another saved deed for this state. */
  startFresh?: boolean;
};

const LAST_STATE_KEY = "deed-wizard-last-state";

function storageKey(stateCode: string) {
  return `deed-wizard-${stateCode.toUpperCase()}`;
}

export function lastWizardPath(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(LAST_STATE_KEY);
  if (stored && /^[A-Z]{2,5}$/.test(stored)) return `/deed/${stored}`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("deed-wizard-") || key === LAST_STATE_KEY) continue;
    const code = key.slice("deed-wizard-".length);
    if (/^[A-Z]{2,5}$/.test(code)) return `/deed/${code}`;
  }
  return null;
}

export function newDraftId() {
  return crypto.randomUUID();
}

export function persistableCheckout(data: CheckoutData): PersistableCheckout {
  return {
    plan: data.plan,
    email: data.email,
    phone: data.phone,
    firm: data.firm,
    emailCopy: data.emailCopy,
    saveToAccount: data.saveToAccount,
    authMode: data.authMode,
  };
}

export function draftHasProgress(snap: Pick<DeedWizardSnapshot, "step" | "form" | "checkout" | "parcelUsed">) {
  return (
    snap.step > 0 ||
    snap.parcelUsed ||
    Boolean(
      snap.form.street ||
        snap.form.house ||
        snap.form.granteeName ||
        snap.form.owner ||
        snap.form.parcel ||
        snap.checkout.email,
    )
  );
}

export function loadLocalDraft(stateCode: string): DeedWizardSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(stateCode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeedWizardSnapshot;
    if (!parsed?.id || !parsed.form) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalDraft(stateCode: string, draft: DeedWizardSnapshot) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(stateCode), JSON.stringify(draft));
  localStorage.setItem(LAST_STATE_KEY, stateCode.toUpperCase());
}

export function clearLocalDraft(stateCode: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(stateCode));
}

export function deedAccessLabel(status: DeedDraftStatus, planId?: string): string {
  if (status !== "paid") return "In progress";
  if (planId === FALLBACK_PLAN_IDS.monthly) return "Firm monthly";
  return "Single package";
}
