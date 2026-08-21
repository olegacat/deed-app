/** Purchase ledger rows — orders, transactions, subscriptions. */

export type OrderKind = "one_time" | "subscription";
export type OrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "canceled"
  | "refunded"
  | "partially_refunded";

export type TransactionType = "charge" | "renewal" | "refund" | "failed";
export type TransactionStatus = "pending" | "succeeded" | "failed" | "canceled";

export type SubscriptionStatus =
  | "incomplete"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "paused"
  | "unpaid";

export type OrderRow = {
  id: string;
  billing_plan_id: string;
  user_id: string | null;
  email: string | null;
  kind: OrderKind;
  status: OrderStatus;
  amount_cents: number;
  currency: string;
  stripe_checkout_session_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at?: string;
};

export type TransactionRow = {
  id: string;
  order_id: string;
  billing_plan_id: string;
  subscription_id: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amount_cents: number;
  currency: string;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_invoice_id: string | null;
  stripe_event_id: string | null;
  created_at: string;
};

export type SubscriptionRow = {
  id: string;
  billing_plan_id: string;
  origin_order_id: string | null;
  user_id: string | null;
  email: string | null;
  status: SubscriptionStatus;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at?: string;
};

export type OrderAdminView = OrderRow & {
  plan_name?: string | null;
  transactions?: TransactionRow[];
  subscription?: SubscriptionRow | null;
};

export function orderKindFromPlan(isRecurring: boolean): OrderKind {
  return isRecurring ? "subscription" : "one_time";
}

export function formatOrderStatus(status: OrderStatus): string {
  if (status === "partially_refunded") return "Partial refund";
  return status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function formatTxnType(type: TransactionType): string {
  if (type === "charge") return "Charge";
  if (type === "renewal") return "Renewal";
  if (type === "refund") return "Refund";
  return "Failed";
}
