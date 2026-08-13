/** Checkout plans — amounts are fixed in code, no Stripe Price IDs in env. */

export type CheckoutPlan = "single" | "monthly";

export const CHECKOUT_PLANS = {
  single: {
    label: "Single package",
    displayPrice: "$49",
    cadence: "one-time",
    productName: "Deed Copilot — single deed package",
    unitAmount: 4900,
    recurring: false as const,
    blurb: "One deed package for this property.",
    perks: ["Draft deed + recording forms", "Transfer-tax worksheet", "PDF export & email copy"],
  },
  monthly: {
    label: "Firm monthly",
    displayPrice: "$149",
    cadence: "per month",
    productName: "Deed Copilot — firm monthly",
    unitAmount: 14900,
    recurring: true as const,
    interval: "month" as const,
    blurb: "Unlimited packages across all live states.",
    perks: [
      "Everything in Single package",
      "Unlimited deed packages",
      "Saved matters in your account",
    ],
  },
} satisfies Record<
  CheckoutPlan,
  {
    label: string;
    displayPrice: string;
    cadence: string;
    productName: string;
    unitAmount: number;
    blurb: string;
    perks: string[];
    recurring: boolean;
    interval?: "month";
  }
>;
