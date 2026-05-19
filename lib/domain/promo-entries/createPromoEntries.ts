import "server-only";

export function getExpectedPromoEntryCount(daypassQuantity: number) {
  if (!Number.isInteger(daypassQuantity) || daypassQuantity < 1 || daypassQuantity > 10) {
    throw new Error("Invalid Daypass quantity for promo entry fulfilment.");
  }

  return daypassQuantity;
}

export function getExpectedFriendCodeCount(daypassQuantity: number) {
  return Math.max(getExpectedPromoEntryCount(daypassQuantity) - 1, 0);
}
