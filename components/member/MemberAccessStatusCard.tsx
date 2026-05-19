"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MemberAccessState = {
  grantId: string | null;
  hasAccess: boolean;
  accessType: "daypass" | "ultra" | null;
  startsAt: string | null;
  expiresAt: string | null;
  needsActivation: boolean;
  status: "pending_activation" | "active" | null;
};

type MemberAccessStatusCardProps = {
  access: MemberAccessState;
  campaignHref: string;
  daypassQuantity: number;
  hasWebhookPendingOrder: boolean;
  timeRemainingLabel: string | null;
};

function formatAccessType(accessType: MemberAccessState["accessType"]) {
  if (accessType === "ultra") {
    return "Ultra";
  }

  if (accessType === "daypass") {
    return "Daypass";
  }

  return "No access";
}

export function MemberAccessStatusCard({
  access,
  campaignHref,
  daypassQuantity,
  hasWebhookPendingOrder,
  timeRemainingLabel,
}: MemberAccessStatusCardProps) {
  const router = useRouter();
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activateDaypass() {
    if (!access.grantId || isActivating) {
      return;
    }

    setError(null);
    setIsActivating(true);

    try {
      const response = await fetch("/api/member/access/activate", {
        body: JSON.stringify({ grantId: access.grantId }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const body = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !body.success) {
        throw new Error(body.error ?? "Daypass access could not be activated.");
      }

      router.refresh();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Daypass access could not be activated.";
      setError(message);
    } finally {
      setIsActivating(false);
    }
  }

  const statusText = access.hasAccess
    ? `${formatAccessType(access.accessType)} active`
    : access.needsActivation
      ? "Daypass ready"
      : "No active access";

  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-orange">Access</p>
          <h2 className="mt-3 text-2xl font-black leading-tight text-ink">{statusText}</h2>
        </div>
        <span className="w-fit rounded-md bg-mint px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-ink">
          {daypassQuantity} Daypass{daypassQuantity === 1 ? "" : "es"} purchased
        </span>
      </div>

      {access.hasAccess && access.accessType === "daypass" ? (
        <div className="mt-5 bg-cream p-4">
          <p className="text-sm font-black uppercase tracking-[0.12em] text-ink/58">Time remaining</p>
          <p className="mt-2 text-xl font-black leading-tight text-ink">{timeRemainingLabel ?? "Active now"}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/62">
            Your member listings access is open until this Daypass window expires.
          </p>
        </div>
      ) : null}

      {access.hasAccess && access.accessType === "ultra" ? (
        <p className="mt-5 text-sm font-semibold leading-6 text-ink/68">
          Monroes Ultra access is active. Subscription lifecycle controls will arrive later.
        </p>
      ) : null}

      {access.needsActivation && access.grantId ? (
        <div className="mt-5 bg-cream p-4">
          <p className="text-sm font-semibold leading-6 text-ink/68">
            Your 12-hour Daypass clock has not started yet. Activate it when you are ready to browse member listings.
          </p>
          <button
            className="mt-4 w-full rounded-md bg-ink px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2 sm:w-auto"
            disabled={isActivating}
            onClick={activateDaypass}
            type="button"
          >
            {isActivating ? "Activating..." : "Activate 12-hour Daypass"}
          </button>
          {error ? <p className="mt-3 text-sm font-bold leading-6 text-red-700">{error}</p> : null}
        </div>
      ) : null}

      {!access.hasAccess && !access.needsActivation && hasWebhookPendingOrder ? (
        <p className="mt-5 text-sm font-semibold leading-6 text-ink/68">
          If you just checked out, access can take a moment to appear while payment confirmation finishes. Check your
          email, then refresh this page.
        </p>
      ) : null}

      {!access.hasAccess && !access.needsActivation && !hasWebhookPendingOrder ? (
        <p className="mt-5 text-sm font-semibold leading-6 text-ink/68">
          Buy a Daypass from Campaign 001 to unlock member listings and receive eligible promo entries.{" "}
          <Link className="font-black text-orange hover:text-orange-hover" href={campaignHref}>
            View the campaign
          </Link>
          .
        </p>
      ) : null}
    </article>
  );
}
