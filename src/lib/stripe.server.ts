import Stripe from "stripe";

export function createStripeClient(secretKey: string): Stripe {
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Set it in .dev.vars (local) or `wrangler secret put STRIPE_SECRET_KEY` (prod), then restart the dev server.",
    );
  }
  return new Stripe(secretKey, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export function getStripeErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const stripeError = error as {
      message?: string;
      type?: string;
      code?: string;
      decline_code?: string;
      param?: string;
      requestId?: string;
      raw?: {
        message?: string;
        type?: string;
        code?: string;
        decline_code?: string;
        param?: string;
        requestId?: string;
      };
    };
    const message = stripeError.raw?.message ?? stripeError.message;
    if (message) {
      const details = [
        stripeError.raw?.type ?? stripeError.type,
        stripeError.raw?.code ?? stripeError.code,
        stripeError.raw?.decline_code ?? stripeError.decline_code,
        stripeError.raw?.param ?? stripeError.param,
        stripeError.raw?.requestId ?? stripeError.requestId,
      ].filter(Boolean);
      return details.length ? `${message} (${details.join(", ")})` : message;
    }
  }
  return "Stripe request failed";
}

async function readWorkerEnv(name: string): Promise<string | undefined> {
  try {
    const { env } = (await import("cloudflare:workers")) as {
      env: Record<string, string | undefined>;
    };
    return env[name];
  } catch {
    return undefined;
  }
}

/** Resolve Stripe secret at request time (Cloudflare Workers + local dev). */
export async function getStripeSecretKey(): Promise<string> {
  const fromWorker = await readWorkerEnv("STRIPE_SECRET_KEY");
  const value = fromWorker ?? process.env.STRIPE_SECRET_KEY;
  if (!value) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Set it in .dev.vars (local) or `wrangler secret put STRIPE_SECRET_KEY` (prod), then restart the dev server.",
    );
  }
  return value;
}
