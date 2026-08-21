import { loadStripe, type Stripe } from "@stripe/stripe-js";

const publishableKey = import.meta.env["VITE_STRIPE_PUBLISHABLE_KEY"];

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!publishableKey) {
    throw new Error("Set VITE_STRIPE_PUBLISHABLE_KEY in .env (Stripe publishable key pk_test_… or pk_live_…).");
  }
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}
