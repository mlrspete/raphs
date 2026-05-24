export type DaypassCheckoutQuantity = 1 | 5 | 10;

export type DaypassCheckoutOptionDefinition = {
  code: "single_daypass" | "five_daypass_bundle" | "ten_daypass_bundle";
  label: string;
  quantity: DaypassCheckoutQuantity;
  stripeLineItemQuantity: 1;
  stripePriceEnvVar: "STRIPE_DAYPASS_PRICE_ID" | "STRIPE_5X_DAYPASS_PRICE_ID" | "STRIPE_10X_DAYPASS_PRICE_ID";
  totalPriceCents: number;
  unitPriceCents: number;
};

export const daypassCheckoutOptions = [
  {
    code: "single_daypass",
    label: "1 Daypass",
    quantity: 1,
    stripeLineItemQuantity: 1,
    stripePriceEnvVar: "STRIPE_DAYPASS_PRICE_ID",
    totalPriceCents: 499,
    unitPriceCents: 499,
  },
  {
    code: "five_daypass_bundle",
    label: "5 Daypasses",
    quantity: 5,
    stripeLineItemQuantity: 1,
    stripePriceEnvVar: "STRIPE_5X_DAYPASS_PRICE_ID",
    totalPriceCents: 1999,
    unitPriceCents: 400,
  },
  {
    code: "ten_daypass_bundle",
    label: "10 Daypasses",
    quantity: 10,
    stripeLineItemQuantity: 1,
    stripePriceEnvVar: "STRIPE_10X_DAYPASS_PRICE_ID",
    totalPriceCents: 3499,
    unitPriceCents: 350,
  },
] as const satisfies readonly DaypassCheckoutOptionDefinition[];

export const defaultDaypassCheckoutQuantity: DaypassCheckoutQuantity = 1;

export function isSupportedDaypassCheckoutQuantity(quantity: number): quantity is DaypassCheckoutQuantity {
  return daypassCheckoutOptions.some((option) => option.quantity === quantity);
}

export function getDaypassCheckoutOptionDefinition(quantity: number) {
  return daypassCheckoutOptions.find((option) => option.quantity === quantity) ?? null;
}
