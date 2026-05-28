const dayInMs = 24 * 60 * 60 * 1000;

export const campaignCountdownDefaultDays = 99;

export type CampaignCountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export type CampaignCountdownState = CampaignCountdownParts & {
  effectiveCloseAt: Date;
  isSoldOut: boolean;
  remainingMs: number;
};

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function isCampaignSoldOut(entryCount: number | null, entryLimit: number | null) {
  return (
    typeof entryCount === "number" &&
    Number.isInteger(entryCount) &&
    entryCount >= 0 &&
    typeof entryLimit === "number" &&
    Number.isInteger(entryLimit) &&
    entryLimit > 0 &&
    entryCount >= entryLimit
  );
}

export function getFallbackCampaignCountdownCloseAt(now: Date, defaultDays = campaignCountdownDefaultDays) {
  return new Date(now.getTime() + defaultDays * dayInMs).toISOString();
}

export function getEffectiveCampaignCountdownCloseAt({
  baseCloseAt,
  entryCount,
  entryLimit,
  now,
}: {
  baseCloseAt: string | null;
  entryCount: number | null;
  entryLimit: number | null;
  now: Date;
}) {
  const baseCloseDate = parseDate(baseCloseAt);

  if (!baseCloseDate) {
    return null;
  }

  if (isCampaignSoldOut(entryCount, entryLimit)) {
    return baseCloseDate;
  }

  const elapsedMs = now.getTime() - baseCloseDate.getTime();

  if (elapsedMs < 0) {
    return baseCloseDate;
  }

  const extensionCount = Math.floor(elapsedMs / dayInMs) + 1;

  return new Date(baseCloseDate.getTime() + extensionCount * dayInMs);
}

export function getCampaignCountdownState({
  baseCloseAt,
  entryCount,
  entryLimit,
  now,
}: {
  baseCloseAt: string | null;
  entryCount: number | null;
  entryLimit: number | null;
  now: Date;
}): CampaignCountdownState | null {
  const effectiveCloseAt = getEffectiveCampaignCountdownCloseAt({
    baseCloseAt,
    entryCount,
    entryLimit,
    now,
  });

  if (!effectiveCloseAt) {
    return null;
  }

  const isSoldOut = isCampaignSoldOut(entryCount, entryLimit);
  const remainingMs = isSoldOut ? 0 : Math.max(effectiveCloseAt.getTime() - now.getTime(), 0);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    effectiveCloseAt,
    hours,
    isSoldOut,
    minutes,
    remainingMs,
    seconds,
  };
}
