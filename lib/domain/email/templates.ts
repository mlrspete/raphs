import "server-only";

import { getEmailAppUrl, getSupportEmail, type TransactionalEmailContent } from "@/lib/domain/email/resend";

type OrderConfirmationTemplateInput = {
  campaignName: string;
  drawAt: string | null;
  drawLockAt: string | null;
  friendCodes: string[];
  orderId: string;
  promoEntryCount: number;
  quantity: number;
  rulesUrl: string | null;
  totalCents: number;
  currency: string;
};

type CodeRedeemedTemplateInput = {
  attributionUpdated: boolean;
  campaignName: string | null;
  codeLast4: string;
  redeemedAt: string | null;
  redemptionBeforeLock: boolean;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${getEmailAppUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-AU", {
    currency,
    style: "currency",
  }).format(cents / 100);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Sydney",
  }).format(new Date(value));
}

function buildHtmlShell(title: string, body: string) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;background:#f8f3e7;color:#211f1a;font-family:Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
          <div style="background:#ffffff;border:1px solid #e9decc;border-radius:8px;padding:28px;">
            ${body}
          </div>
        </div>
      </body>
    </html>
  `;
}

function paragraph(value: string) {
  return `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">${value}</p>`;
}

function list(items: string[]) {
  return `<ul style="font-size:15px;line-height:1.6;margin:0 0 18px;padding-left:20px;">${items
    .map((item) => `<li>${item}</li>`)
    .join("")}</ul>`;
}

function link(label: string, href: string) {
  const safeHref = escapeHtml(absoluteUrl(href));
  return `<a href="${safeHref}" style="color:#c65f24;font-weight:700;">${escapeHtml(label)}</a>`;
}

export function buildOrderConfirmationEmail(input: OrderConfirmationTemplateInput): TransactionalEmailContent {
  const orderShortId = input.orderId.slice(0, 8).toUpperCase();
  const memberUrl = absoluteUrl("/member");
  const redeemUrl = absoluteUrl("/redeem");
  const rulesUrl = absoluteUrl(input.rulesUrl ?? "/promo-rules/campaign-001");
  const refundUrl = absoluteUrl("/refund-policy");
  const supportEmail = getSupportEmail();
  const drawAt = formatDateTime(input.drawAt);
  const drawLockAt = formatDateTime(input.drawLockAt);
  const friendCodeLines = input.friendCodes.map((code) => `- ${code}`);
  const subject = `Your Monroes Daypass order ${orderShortId}`;
  const friendCodeHtml =
    input.friendCodes.length > 0
      ? `
        <h2 style="font-size:18px;margin:24px 0 12px;">Friend Daypass codes</h2>
        ${paragraph("Send these to friends privately. Do not put codes in public posts, URLs, or screenshots.")}
        <div style="background:#f8f3e7;border:1px solid #e9decc;border-radius:6px;padding:14px;">
          ${input.friendCodes
            .map((code) => `<p style="font-family:Consolas,monospace;font-size:16px;margin:0 0 8px;">${escapeHtml(code)}</p>`)
            .join("")}
        </div>
        ${paragraph(`Friends should open ${link("the redemption page", "/redeem")} and paste a code after signing in.`)}
      `
      : paragraph("No friend codes were created for this order because you purchased one Daypass.");
  const lockCopy = drawLockAt
    ? `Friend-code redemption before ${escapeHtml(drawLockAt)} can update promo entry holder attribution. After that, attribution is locked, but valid codes may still grant Daypass access.`
    : "Promo entry attribution lock timing will be confirmed before launch.";
  const html = buildHtmlShell(
    subject,
    `
      <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#c65f24;font-weight:800;margin:0 0 10px;">Monroes</p>
      <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px;">Your Daypass order is confirmed</h1>
      ${paragraph(`Order ${escapeHtml(orderShortId)} is confirmed for ${escapeHtml(input.campaignName)}.`)}
      ${list([
        `Quantity: ${input.quantity} Daypass${input.quantity === 1 ? "" : "es"}`,
        `Total paid: ${escapeHtml(formatMoney(input.totalCents, input.currency))}`,
        `Promo entries: ${input.promoEntryCount}`,
        drawAt ? `Planned draw: ${escapeHtml(drawAt)}` : "Planned draw: final timing pending",
      ])}
      ${paragraph("Eligible Daypass purchases receive free entry into the promotion. You are not buying entries.")}
      <h2 style="font-size:18px;margin:24px 0 12px;">Access instructions</h2>
      ${list([
        `Open ${link("your member dashboard", "/member")} and log in with the same email used at checkout.`,
        "Your Daypass starts as pending access. Activate it only when you are ready to start the 12-hour window.",
        `Friend codes are redeemed at ${link("the redemption page", "/redeem")}. Codes are pasted into the form, never added to links.`,
      ])}
      ${friendCodeHtml}
      <h2 style="font-size:18px;margin:24px 0 12px;">Promotion notes</h2>
      ${paragraph(lockCopy)}
      ${paragraph(`${link("Promotion rules", rulesUrl)} | ${link("Refund policy", refundUrl)} | Support: ${escapeHtml(supportEmail)}`)}
    `,
  );
  const text = [
    `Your Monroes Daypass order is confirmed`,
    ``,
    `Order: ${orderShortId}`,
    `Campaign: ${input.campaignName}`,
    `Quantity: ${input.quantity}`,
    `Total paid: ${formatMoney(input.totalCents, input.currency)}`,
    `Promo entries: ${input.promoEntryCount}`,
    drawAt ? `Planned draw: ${drawAt}` : `Planned draw: final timing pending`,
    ``,
    `Eligible Daypass purchases receive free entry into the promotion. You are not buying entries.`,
    ``,
    `Access instructions:`,
    `- Log in with the same checkout email: ${memberUrl}`,
    `- Your Daypass is pending until you activate it from the member dashboard.`,
    `- Friends redeem codes at ${redeemUrl} by pasting the code into the form. Do not put codes in URLs.`,
    ``,
    input.friendCodes.length > 0 ? `Friend Daypass codes:` : `No friend codes were created for this one-Daypass order.`,
    ...friendCodeLines,
    ``,
    lockCopy.replaceAll("&#39;", "'"),
    ``,
    `Promotion rules: ${rulesUrl}`,
    `Refund policy: ${refundUrl}`,
    `Support: ${supportEmail}`,
  ].join("\n");

  return {
    html,
    subject,
    text,
  };
}

export function buildCodeRedeemedEmail(input: CodeRedeemedTemplateInput): TransactionalEmailContent {
  const memberUrl = absoluteUrl("/member");
  const redeemedAt = formatDateTime(input.redeemedAt);
  const campaignName = input.campaignName ?? "your Monroes campaign";
  const attributionCopy = input.attributionUpdated
    ? "Promo entry holder attribution was updated because redemption happened before the draw lock."
    : "Promo entry attribution is locked or unchanged. The Daypass access was still granted.";
  const subject = `A Monroes Daypass code ending ${input.codeLast4} was redeemed`;
  const html = buildHtmlShell(
    subject,
    `
      <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#c65f24;font-weight:800;margin:0 0 10px;">Monroes</p>
      <h1 style="font-size:26px;line-height:1.2;margin:0 0 16px;">A friend code was redeemed</h1>
      ${paragraph(`A Daypass code ending in ${escapeHtml(input.codeLast4)} was redeemed${redeemedAt ? ` on ${escapeHtml(redeemedAt)}` : ""}.`)}
      ${paragraph(`Campaign: ${escapeHtml(campaignName)}.`)}
      ${paragraph(attributionCopy)}
      ${paragraph(`You can review code status from ${link("your member dashboard", memberUrl)}.`)}
    `,
  );
  const text = [
    `A Monroes Daypass code was redeemed`,
    ``,
    `Code ending: ${input.codeLast4}`,
    `Campaign: ${campaignName}`,
    redeemedAt ? `Redeemed: ${redeemedAt}` : null,
    attributionCopy,
    ``,
    `Member dashboard: ${memberUrl}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return {
    html,
    subject,
    text,
  };
}
