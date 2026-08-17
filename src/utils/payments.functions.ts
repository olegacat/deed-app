import { createServerFn } from "@tanstack/react-start";
import { CHECKOUT_PLANS, type CheckoutPlan } from "@/lib/checkout-plans";
import { createStripeClient, getStripeErrorMessage, getStripeSecretKey } from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0]!.id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0]!;
      if (options.userId && customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: {
    plan: CheckoutPlan;
    customerEmail?: string;
    userId?: string;
    returnUrl: string;
  }) => {
    if (data.plan !== "single" && data.plan !== "monthly") {
      throw new Error('plan must be "single" or "monthly".');
    }
    return data;
  })
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(await getStripeSecretKey());
      const plan = CHECKOUT_PLANS[data.plan];
      const isRecurring = plan.recurring;

      const customerId =
        data.customerEmail || data.userId
          ? await resolveOrCreateCustomer(stripe, {
              ...(data.customerEmail ? { email: data.customerEmail } : {}),
              ...(data.userId ? { userId: data.userId } : {}),
            })
          : undefined;

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: plan.unitAmount,
              product_data: { name: plan.productName },
              ...(isRecurring && plan.interval ? { recurring: { interval: plan.interval } } : {}),
            },
          },
        ],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        // Card payments: stay in embed + fire onComplete (mobile-friendly).
        // Redirect-based methods (e.g. bank) still use return_url.
        redirect_on_completion: "if_required",
        return_url: data.returnUrl,
        ...(customerId && { customer: customerId }),
        ...(!isRecurring && {
          payment_intent_data: { description: plan.productName },
        }),
        ...(data.userId && {
          metadata: { userId: data.userId, plan: data.plan },
          ...(isRecurring && { subscription_data: { metadata: { userId: data.userId } } }),
        }),
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
