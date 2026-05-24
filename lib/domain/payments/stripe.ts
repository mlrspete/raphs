import "server-only";

import Stripe from "stripe";

import { getDaypassCheckoutOptionDefinition } from "@/lib/domain/daypass/pricing";
import type { CommerceOffer } from "@/lib/types/database";

const stripeApiVersion = "2026-04-22.dahlia";

export type StripeDaypassCheckoutOption = NonNullable<ReturnType<typeof getStripeDaypassCheckoutOption>>;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe checkout is not configured. Missing STRIPE_SECRET_KEY.");
  }

  return new Stripe(secretKey, {
    apiVersion: stripeApiVersion,
  });
}

export function getStripeDaypassPriceId(offer: CommerceOffer) {
  const priceId = process.env.STRIPE_DAYPASS_PRICE_ID ?? offer.stripe_price_id ?? null;

  if (!priceId) {
    throw new Error("Stripe Daypass price is not configured. Set STRIPE_DAYPASS_PRICE_ID or commerce_offers.stripe_price_id.");
  }

  return priceId;
}

export function assertStripeSecretConfigured() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe checkout is not configured. Missing STRIPE_SECRET_KEY.");
  }
}

export function getStripeDaypassCheckoutOption(offer: CommerceOffer, quantity: number) {
  const option = getDaypassCheckoutOptionDefinition(quantity);

  if (!option) {
    throw new Error("Unsupported Daypass quantity. Choose 1, 5, or 10 Daypasses.");
  }

  const priceId =
    option.quantity === 1
      ? process.env[option.stripePriceEnvVar] ?? offer.stripe_price_id ?? null
      : process.env[option.stripePriceEnvVar] ?? null;

  if (!priceId) {
    const fallback = option.quantity === 1 ? " or commerce_offers.stripe_price_id" : "";
    throw new Error(`Stripe Daypass price is not configured. Set ${option.stripePriceEnvVar}${fallback}.`);
  }

  return {
    ...option,
    stripePriceId: priceId,
  };
}

export function assertStripeCheckoutConfigured(offer: CommerceOffer, quantity = 1) {
  getStripeDaypassCheckoutOption(offer, quantity);
  assertStripeSecretConfigured();
}

export function getCheckoutBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}
