import "server-only";

import { Resend, type CreateEmailOptions } from "resend";

export type TransactionalEmailContent = {
  html: string;
  subject: string;
  text: string;
};

export type TransactionalEmailSendInput = TransactionalEmailContent & {
  idempotencyKey: string;
  to: string;
  tags?: CreateEmailOptions["tags"];
};

export type TransactionalEmailProviderResult = {
  errorMessage: string | null;
  providerMessageId: string | null;
  status: "sent" | "failed" | "skipped";
};

export function getEmailAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function getSupportEmail() {
  return process.env.SUPPORT_EMAIL?.trim() || process.env.TRANSACTIONAL_EMAIL_FROM?.trim() || "support@monroes.example";
}

export function getTransactionalEmailConfigStatus() {
  const missing: string[] = [];

  if (!process.env.RESEND_API_KEY?.trim()) {
    missing.push("RESEND_API_KEY");
  }

  if (!process.env.TRANSACTIONAL_EMAIL_FROM?.trim()) {
    missing.push("TRANSACTIONAL_EMAIL_FROM");
  }

  return {
    canSend: missing.length === 0,
    missing,
  };
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return new Resend(apiKey);
}

function getFromEmail() {
  const from = process.env.TRANSACTIONAL_EMAIL_FROM?.trim();

  if (!from) {
    throw new Error("TRANSACTIONAL_EMAIL_FROM is not configured.");
  }

  return from;
}

function sanitizeProviderError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 800);
}

export async function sendWithResend(input: TransactionalEmailSendInput): Promise<TransactionalEmailProviderResult> {
  const configStatus = getTransactionalEmailConfigStatus();

  if (!configStatus.canSend) {
    return {
      errorMessage: `Transactional email skipped because ${configStatus.missing.join(", ")} is not configured.`,
      providerMessageId: null,
      status: "skipped",
    };
  }

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send(
      {
        from: getFromEmail(),
        html: input.html,
        replyTo: getSupportEmail(),
        subject: input.subject,
        tags: input.tags,
        text: input.text,
        to: input.to,
      },
      {
        idempotencyKey: input.idempotencyKey,
      },
    );

    if (error) {
      return {
        errorMessage: sanitizeProviderError(error.message),
        providerMessageId: null,
        status: "failed",
      };
    }

    return {
      errorMessage: null,
      providerMessageId: data?.id ?? null,
      status: "sent",
    };
  } catch (error) {
    return {
      errorMessage: sanitizeProviderError(error),
      providerMessageId: null,
      status: "failed",
    };
  }
}
