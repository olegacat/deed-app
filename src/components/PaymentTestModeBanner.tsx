import { isStripeTestMode } from "@/lib/stripe";

export function PaymentTestModeBanner() {
  if (!isStripeTestMode()) {
    return (
      <div className="mb-6 rounded-sm border border-border bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
        Stripe live mode — real cards will be charged.
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-sm border border-accent/35 bg-accent/10 px-4 py-3 text-xs text-foreground">
      Stripe test mode — use card <span className="font-mono">4242 4242 4242 4242</span>, any future
      expiry and CVC.
    </div>
  );
}
