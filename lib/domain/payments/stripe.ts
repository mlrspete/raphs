import "server-only";

import Stripe from "stripe";

import type { CommerceOffer } from "@/lib/types/database";

const stripeApiVersion = "2026-04-22.dahlia";

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
  const priceId = offer.stripe_price_id ?? process.env.STRIPE_DAYPASS_PRICE_ID ?? null;

  if (!priceId) {
    throw new Error("Stripe Daypass price is not configured. Set STRIPE_DAYPASS_PRICE_ID or commerce_offers.stripe_price_id.");
  }

  return priceId;
}

export function assertStripeCheckoutConfigured(offer: CommerceOffer) {
  getStripeDaypassPriceId(offer);

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe checkout is not configured. Missing STRIPE_SECRET_KEY.");
  }
}

export function getCheckoutBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
