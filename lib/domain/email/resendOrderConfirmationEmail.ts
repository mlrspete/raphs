import "server-only";

import { decryptDaypassCode } from "@/lib/domain/daypass-codes/encryption";
import { sendLoggedTransactionalEmail, type LoggedEmailResult } from "@/lib/domain/email/outboundEmailLog";
import { buildOrderConfirmationEmail } from "@/lib/domain/email/templates";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type ResendOrderConfirmationEmailInput = {
  idempotencySuffix?: string;
  orderId: string;
};

async function loadResendContext(orderId: string) {
  const supabase = createAdminSupabaseClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, purchaser_email, total_cents, currency")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order?.purchaser_email) {
    throw new Error("Order confirmation resend requires a purchaser email.");
  }

  const { data: orderItem, error: orderItemError } = await supabase
    .from("order_items")
    .select("campaign_id, quantity")
    .eq("order_id", orderId)
    .eq("item_type", "daypass")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (orderItemError) {
    throw new Error(orderItemError.message);
  }

  if (!orderItem?.campaign_id) {
    throw new Error("Order confirmation resend requires a Daypass order item.");
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("promo_campaigns")
    .select("id, name, draw_at, draw_lock_at, rules_url")
    .eq("id", orderItem.campaign_id)
    .maybeSingle();

  if (campaignError) {
    throw new Error(campaignError.message);
  }

  if (!campaign) {
    throw new Error("Order confirmation resend requires a campaign.");
  }

  const { data: codeRows, error: codeError } = await supabase
    .from("daypass_codes")
    .select("code_last4, encrypted_code")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (codeError) {
    throw new Error(codeError.message);
  }

  const { count, error: entryError } = await supabase
    .from("promo_entries")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("order_id", orderId);

  if (entryError) {
    throw new Error(entryError.message);
  }

  return {
    campaign,
    codeRows: codeRows ?? [],
    order: {
      currency: order.currency,
      id: order.id,
      purchaser_email: order.purchaser_email,
      total_cents: order.total_cents,
    },
    orderItem: {
      campaign_id: orderItem.campaign_id,
      quantity: orderItem.quantity,
    },
    promoEntryCount: count ?? 0,
  };
}

export async function resendOrderConfirmationEmail({
  idempotencySuffix = "manual",
  orderId,
}: ResendOrderConfirmationEmailInput): Promise<LoggedEmailResult> {
  const context = await loadResendContext(orderId);
  const idempotencyKey = `purchase_confirmation_resend:${orderId}:${idempotencySuffix}`;

  return sendLoggedTransactionalEmail({
    idempotencyKey,
    recipientEmail: context.order.purchaser_email,
    relatedCampaignId: context.campaign.id,
    relatedOrderId: context.order.id,
    render: () =>
      buildOrderConfirmationEmail({
        campaignName: context.campaign.name,
        currency: context.order.currency,
        drawAt: context.campaign.draw_at,
        drawLockAt: context.campaign.draw_lock_at,
        friendCodes: context.codeRows.map((codeRow) => {
          if (!codeRow.encrypted_code) {
            throw new Error(`Daypass code ending ${codeRow.code_last4} cannot be recovered.`);
          }

          return decryptDaypassCode(codeRow.encrypted_code);
        }),
        orderId: context.order.id,
        promoEntryCount: context.promoEntryCount,
        quantity: context.orderItem.quantity,
        rulesUrl: context.campaign.rules_url,
        totalCents: context.order.total_cents,
      }),
    tags: [
      {
        name: "template",
        value: "purchase_confirmation_resend",
      },
      {
        name: "order",
        value: context.order.id.slice(0, 8),
      },
    ],
    templateKey: "purchase_confirmation_resend",
  });
}
