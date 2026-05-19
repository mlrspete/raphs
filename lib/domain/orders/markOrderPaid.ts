import "server-only";

import type Stripe from "stripe";

function readStripeId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export function getPaidOrderStripeFields(session: Stripe.Checkout.Session) {
  return {
    stripeCustomerId: readStripeId(session.customer),
    stripePaymentIntentId: readStripeId(session.payment_intent),
  };
}
