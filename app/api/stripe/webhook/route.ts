import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { fulfillCheckout } from "@/lib/domain/payments/fulfillCheckout";
import { getStripeClient } from "@/lib/domain/payments/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json, StripeWebhookProcessingStatus } from "@/lib/types/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WebhookApiResponse = {
  received: boolean;
  status: "processed" | "ignored" | "failed" | "duplicate";
};

function methodNotAllowed() {
  return NextResponse.json(
    {
      received: false,
      status: "failed",
    },
    {
      headers: {
        Allow: "POST",
      },
      status: 405,
    },
  );
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? {})) as Json;
}

function sanitizeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 800);
}

function readObjectString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getCheckoutSessionFromEvent(event: Stripe.Event) {
  if (event.data.object.object !== "checkout.session") {
    return null;
  }

  return event.data.object as Stripe.Checkout.Session;
}

function getSanitizedPayload(event: Stripe.Event, status: StripeWebhookProcessingStatus, errorMessage?: string) {
  const session = getCheckoutSessionFromEvent(event);
  const paymentIntentId = session ? readObjectString(session.payment_intent) : null;
  const orderId = session?.metadata?.order_id ?? null;

  return toJson({
    event_id: event.id,
    event_type: event.type,
    order_id: orderId,
    payment_intent_id: paymentIntentId,
    processing_status: status,
    stripe_checkout_session_id: session?.id ?? null,
    ...(errorMessage ? { error_message: errorMessage } : {}),
  });
}

async function upsertWebhookReceipt(event: Stripe.Event) {
  const session = getCheckoutSessionFromEvent(event);
  const supabase = createAdminSupabaseClient();
  const { data: existing, error: existingError } = await supabase
    .from("stripe_webhook_events")
    .select("id, processing_status")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.processing_status === "processed") {
    return {
      alreadyProcessed: true,
    };
  }

  const payload = {
    event_type: event.type,
    payload_json: getSanitizedPayload(event, "received"),
    processing_status: "received" as const,
    stripe_checkout_session_id: session?.id ?? null,
    stripe_event_id: event.id,
  };

  if (existing) {
    const { error } = await supabase.from("stripe_webhook_events").update(payload).eq("stripe_event_id", event.id);

    if (error) {
      throw new Error(error.message);
    }

    return {
      alreadyProcessed: false,
    };
  }

  const { error } = await supabase.from("stripe_webhook_events").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  return {
    alreadyProcessed: false,
  };
}

async function updateWebhookEventStatus(
  event: Stripe.Event,
  status: StripeWebhookProcessingStatus,
  errorMessage?: string,
) {
  const session = getCheckoutSessionFromEvent(event);
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("stripe_webhook_events")
    .update({
      error_message: errorMessage ?? null,
      payload_json: getSanitizedPayload(event, status, errorMessage),
      processing_status: status,
      stripe_checkout_session_id: session?.id ?? null,
      ...(status === "processed" || status === "ignored" ? { processed_at: new Date().toISOString() } : {}),
    })
    .eq("stripe_event_id", event.id);

  if (error) {
    throw new Error(error.message);
  }
}

export function GET() {
  return methodNotAllowed();
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json<WebhookApiResponse>(
      {
        received: false,
        status: "failed",
      },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json<WebhookApiResponse>(
      {
        received: false,
        status: "failed",
      },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json<WebhookApiResponse>(
      {
        received: false,
        status: "failed",
      },
      { status: 400 },
    );
  }

  try {
    const receipt = await upsertWebhookReceipt(event);

    if (receipt.alreadyProcessed) {
      return NextResponse.json<WebhookApiResponse>({
        received: true,
        status: "duplicate",
      });
    }

    if (event.type !== "checkout.session.completed") {
      await updateWebhookEventStatus(event, "ignored");

      return NextResponse.json<WebhookApiResponse>({
        received: true,
        status: "ignored",
      });
    }

    const session = getCheckoutSessionFromEvent(event);

    if (!session?.id) {
      throw new Error("checkout.session.completed event did not contain a Checkout Session.");
    }

    await updateWebhookEventStatus(event, "processing");
    await fulfillCheckout({
      sessionId: session.id,
      stripeEventId: event.id,
      webhookPayload: getSanitizedPayload(event, "processing"),
    });

    return NextResponse.json<WebhookApiResponse>({
      received: true,
      status: "processed",
    });
  } catch (error) {
    const errorMessage = sanitizeError(error);
    console.error(`Stripe webhook fulfilment failed: ${errorMessage}`);

    try {
      await updateWebhookEventStatus(event, "failed", errorMessage);
    } catch (statusError) {
      console.error(`Stripe webhook failure status could not be recorded: ${sanitizeError(statusError)}`);
    }

    return NextResponse.json<WebhookApiResponse>(
      {
        received: true,
        status: "failed",
      },
      { status: 500 },
    );
  }
}
