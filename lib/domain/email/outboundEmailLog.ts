import "server-only";

import { sendWithResend, getTransactionalEmailConfigStatus, type TransactionalEmailContent } from "@/lib/domain/email/resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { OutboundEmail, OutboundEmailStatus } from "@/lib/types/database";

type SendLoggedTransactionalEmailInput = {
  idempotencyKey: string;
  recipientEmail: string;
  relatedCampaignId?: string | null;
  relatedOrderId?: string | null;
  render: () => Promise<TransactionalEmailContent> | TransactionalEmailContent;
  tags?: {
    name: string;
    value: string;
  }[];
  templateKey: string;
};

export type LoggedEmailResult = {
  errorMessage: string | null;
  idempotencyKey: string;
  providerMessageId: string | null;
  status: OutboundEmailStatus;
};

function sanitizeEmailError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 800);
}

async function getExistingEmail(idempotencyKey: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("outbound_emails")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function upsertEmailLog({
  idempotencyKey,
  recipientEmail,
  relatedCampaignId,
  relatedOrderId,
  status,
  templateKey,
}: {
  idempotencyKey: string;
  recipientEmail: string;
  relatedCampaignId?: string | null;
  relatedOrderId?: string | null;
  status: OutboundEmailStatus;
  templateKey: string;
}) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("outbound_emails").upsert(
    {
      error_message: null,
      idempotency_key: idempotencyKey,
      provider: "resend",
      provider_message_id: null,
      recipient_email: recipientEmail,
      related_campaign_id: relatedCampaignId ?? null,
      related_order_id: relatedOrderId ?? null,
      sent_at: null,
      status,
      template_key: templateKey,
    },
    {
      onConflict: "idempotency_key",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function updateEmailLog({
  errorMessage,
  idempotencyKey,
  providerMessageId,
  status,
}: {
  errorMessage: string | null;
  idempotencyKey: string;
  providerMessageId: string | null;
  status: OutboundEmailStatus;
}) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("outbound_emails")
    .update({
      error_message: errorMessage,
      provider_message_id: providerMessageId,
      sent_at: status === "sent" ? new Date().toISOString() : null,
      status,
    })
    .eq("idempotency_key", idempotencyKey);

  if (error) {
    throw new Error(error.message);
  }
}

function skippedResult(idempotencyKey: string, existing: OutboundEmail): LoggedEmailResult {
  return {
    errorMessage: existing.error_message,
    idempotencyKey,
    providerMessageId: existing.provider_message_id,
    status: "skipped",
  };
}

export async function sendLoggedTransactionalEmail(input: SendLoggedTransactionalEmailInput): Promise<LoggedEmailResult> {
  const existing = await getExistingEmail(input.idempotencyKey);

  if (existing?.status === "sent") {
    return skippedResult(input.idempotencyKey, existing);
  }

  await upsertEmailLog({
    idempotencyKey: input.idempotencyKey,
    recipientEmail: input.recipientEmail,
    relatedCampaignId: input.relatedCampaignId,
    relatedOrderId: input.relatedOrderId,
    status: "queued",
    templateKey: input.templateKey,
  });

  const configStatus = getTransactionalEmailConfigStatus();

  if (!configStatus.canSend) {
    const errorMessage = `Transactional email skipped because ${configStatus.missing.join(", ")} is not configured.`;
    console.warn(errorMessage);
    await updateEmailLog({
      errorMessage,
      idempotencyKey: input.idempotencyKey,
      providerMessageId: null,
      status: "skipped",
    });

    return {
      errorMessage,
      idempotencyKey: input.idempotencyKey,
      providerMessageId: null,
      status: "skipped",
    };
  }

  let content: TransactionalEmailContent;

  try {
    content = await input.render();
  } catch (error) {
    const errorMessage = sanitizeEmailError(error);
    await updateEmailLog({
      errorMessage,
      idempotencyKey: input.idempotencyKey,
      providerMessageId: null,
      status: "failed",
    });

    return {
      errorMessage,
      idempotencyKey: input.idempotencyKey,
      providerMessageId: null,
      status: "failed",
    };
  }

  const providerResult = await sendWithResend({
    ...content,
    idempotencyKey: input.idempotencyKey,
    tags: input.tags,
    to: input.recipientEmail,
  });
  await updateEmailLog({
    errorMessage: providerResult.errorMessage,
    idempotencyKey: input.idempotencyKey,
    providerMessageId: providerResult.providerMessageId,
    status: providerResult.status,
  });

  return {
    errorMessage: providerResult.errorMessage,
    idempotencyKey: input.idempotencyKey,
    providerMessageId: providerResult.providerMessageId,
    status: providerResult.status,
  };
}
