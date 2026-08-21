import { createServerFn } from "@tanstack/react-start";
import { loadPublicBillingPlans } from "@/lib/billing-plans.load";

/** Active plans for Checkout UI — reads `billing_plans` (admin is source of truth). */
export const listBillingPlans = createServerFn({ method: "GET" }).handler(async () => {
  return loadPublicBillingPlans();
});
