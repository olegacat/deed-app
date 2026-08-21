import { createServerFn } from "@tanstack/react-start";

import {

  assertBillingPlanId,

  billingPlanRowFromFallback,

  loadPublicBillingPlans,

  resolveBillingPlanForCheckout,

} from "@/lib/billing-plans.load";

import { createStripeClient, getStripeErrorMessage, getStripeSecretKey } from "@/lib/stripe.server";

import type { BillingPlanRow } from "@/lib/billing-plans";

import { CHECKOUT_PLANS_FALLBACK } from "@/lib/checkout-plans";



type CheckoutSessionResult = { clientSecret: string } | { error: string };



function stripeInterval(

  interval: string | null,

): "day" | "week" | "month" | "year" | undefined {

  if (interval === "day" || interval === "week" || interval === "month" || interval === "year") {

    return interval;

  }

  return undefined;

}



function lineItemsFromPlan(plan: BillingPlanRow) {

  const recurringInterval = stripeInterval(plan.billing_interval);

  return [

    {

      quantity: 1,

      price_data: {

        currency: plan.currency,

        unit_amount: plan.amount_cents,

        product_data: { name: plan.name },

        ...(plan.is_recurring && recurringInterval

          ? { recurring: { interval: recurringInterval } }

          : {}),

      },

    },

  ];

}



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



/** Active plans for Checkout UI — reads `billing_plans` (admin is source of truth). */

export const listBillingPlans = createServerFn({ method: "GET" }).handler(async () => {

  return loadPublicBillingPlans();

});



export const createCheckoutSession = createServerFn({ method: "POST" })

  .inputValidator((data: {

    plan: string;

    customerEmail?: string;

    userId?: string;

    returnUrl: string;

  }) => {

    assertBillingPlanId(data.plan);

    return data;

  })

  .handler(async ({ data }): Promise<CheckoutSessionResult> => {

    try {

      const stripe = createStripeClient(await getStripeSecretKey());

      const planId = assertBillingPlanId(data.plan);



      let plan = await resolveBillingPlanForCheckout(planId);

      const hasSupabase = Boolean(
        process.env["EXT_SUPABASE_URL"] || process.env["SUPABASE_URL"],
      );



      if (!plan && hasSupabase) {

        return {

          error: `Plan "${planId}" is not configured in billing_plans (or is inactive).`,

        };

      }

      if (!plan) {

        const fallback = CHECKOUT_PLANS_FALLBACK.find((p) => p.id === planId);

        if (!fallback) {

          return { error: `Plan "${planId}" is not available.` };

        }

        plan = billingPlanRowFromFallback(planId);

      }



      const customerId =

        data.customerEmail || data.userId

          ? await resolveOrCreateCustomer(stripe, {

              ...(data.customerEmail ? { email: data.customerEmail } : {}),

              ...(data.userId ? { userId: data.userId } : {}),

            })

          : undefined;



      const session = await stripe.checkout.sessions.create({

        line_items: lineItemsFromPlan(plan),

        mode: plan.is_recurring ? "subscription" : "payment",

        ui_mode: "embedded_page",

        redirect_on_completion: "if_required",

        return_url: data.returnUrl,

        ...(customerId && { customer: customerId }),

        ...(!plan.is_recurring && {

          payment_intent_data: { description: plan.name },

        }),

        metadata: {

          planId,

          planName: plan.name,

          amountCents: String(plan.amount_cents),

          ...(data.userId ? { userId: data.userId } : {}),

        },

        ...(data.userId &&

          plan.is_recurring && {

            subscription_data: { metadata: { userId: data.userId, planId } },

          }),

      });



      return { clientSecret: session.client_secret ?? "" };

    } catch (error) {

      return { error: getStripeErrorMessage(error) };

    }

  });

