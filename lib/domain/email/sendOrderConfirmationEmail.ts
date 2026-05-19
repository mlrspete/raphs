import "server-only";

import { decryptDaypassCode } from "@/lib/domain/daypass-codes/encryption";
import { sendLoggedTransactionalEmail, type LoggedEmailResult } from "@/lib/domain/email/outboundEmailLog";
import { buildOrderConfirmationEmail } from "@/lib/domain/email/templates";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type SendOrderConfirmationEmailInput = {
  orderId: string;
  plainFriendCodes?: string[];
};

type DaypassCodeRecoveryRow = {
  code_last4: string;
  encrypted_code: string | null;
  id: string;
};

type OrderEmailContext = {
  campaign: {
    draw_at: string | null;
    draw_lock_at: string | null;
    id: string;
    name: string;
    rules_url: string | null;
  };
  codeRows: DaypassCodeRecoveryRow[];
  order: {
    currency: string;
    id: string;
    purchaser_email: string;
    total_cents: number;
  };
  orderItem: {
    campaign_id: string;
    quantity: number;
  };
  promoEntryCount: number;
};

async function countPromoEntries(orderId: string) {
  const supabase = createAdminSupabaseClient();
  const { count, error } = await supabase
    .from("promo_entries")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("order_id", orderId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function loadOrderEmailContext(orderId: string): Promise<OrderEmailContext> {
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
    throw new Error("Order confirmation email requires a purchaser email.");
  }

  const { data: orderItem, error: orderItemError } = await supabase
    .from("order_items")
    .select("id, campaign_id, quantity")
    .eq("order_id", orderId)
    .eq("item_type", "daypass")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (orderItemError) {
    throw new Error(orderItemError.message);
  }

  if (!orderItem?.campaign_id) {
    throw new Error("Order confirmation email requires a Daypass order item.");
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
    throw new Error("Order confirmation email requires a campaign.");
  }

  const { data: codeRows, error: codesError } = await supabase
    .from("daypass_codes")
    .select("id, code_last4, encrypted_code")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (codesError) {
    throw new Error(codesError.message);
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
    promoEntryCount: await countPromoEntries(orderId),
  };
}

function recoverFriendCodes(codeRows: DaypassCodeRecoveryRow[]) {
  return codeRows.map((codeRow) => {
    if (!codeRow.encrypted_code) {
      throw new Error(`Daypass code ending ${codeRow.code_last4} cannot be recovered.`);
    }

    return decryptDaypassCode(codeRow.encrypted_code);
  });
}

export async function sendOrderConfirmationEmail({
  orderId,
  plainFriendCodes = [],
}: SendOrderConfirmationEmailInput): Promise<LoggedEmailResult> {
  const context = await loadOrderEmailContext(orderId);
  const idempotencyKey = `purchase_confirmation:${orderId}`;

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
        friendCodes: plainFriendCodes.length > 0 ? plainFriendCodes : recoverFriendCodes(context.codeRows),
        orderId: context.order.id,
        promoEntryCount: context.promoEntryCount,
        quantity: context.orderItem.quantity,
        rulesUrl: context.campaign.rules_url,
        totalCents: context.order.total_cents,
      }),
    tags: [
      {
        name: "template",
        value: "purchase_confirmation",
      },
      {
        name: "order",
        value: context.order.id.slice(0, 8),
      },
    ],
    templateKey: "purchase_confirmation",
  });
}
