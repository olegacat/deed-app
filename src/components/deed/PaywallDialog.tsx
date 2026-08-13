import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { X } from "lucide-react";
import { getStripe } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";

export function PaywallDialog({
  open,
  plan,
  email,
  userId,
  title,
  onClose,
}: {
  open: boolean;
  plan: "single" | "monthly";
  email?: string;
  userId?: string;
  title: string;
  onClose: () => void;
}) {
  if (!open) return null;

  const fetchClientSecret = async (): Promise<string> => {
    const result = await createCheckoutSession({
      data: {
        plan,
        ...(email ? { customerEmail: email } : {}),
        ...(userId ? { userId } : {}),
        returnUrl: `${window.location.href.split("?")[0]}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Payment could not be started.");
    return result.clientSecret;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/60 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-sm border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">Secure payment</p>
            <h3 className="mt-1 font-display text-2xl leading-none text-foreground">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment"
            className="rounded-sm border border-input p-1.5 text-foreground transition-colors hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-2 sm:p-4">
          <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}
