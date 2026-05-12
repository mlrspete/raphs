export const site = {
  name: "Raph\u2019s Market",
  description: "Private access to OG, rare, vintage, and interesting skateboard decks.",
  market: "Australia",
  currency: "AUD",
  offers: {
    previewPass: {
      name: "1-Day Preview Pass",
      price: "$4.99 AUD",
      priceCents: 499,
      offerId: "homepage_preview_pass",
      offerType: "preview_pass",
      note: "A short look inside the private marketplace concept.",
    },
    monthlyPass: {
      name: "Monthly Marketplace Pass",
      price: "$24.99 AUD/month",
      priceCents: 2499,
      offerId: "homepage_monthly_pass",
      offerType: "monthly_pass",
      note: "Ongoing access for buyers who want the full private market.",
    },
    previewUpgrade: {
      name: "Preview Pass Upgrade",
      price: "$20 AUD",
      priceCents: 2000,
      offerId: "homepage_preview_upgrade",
      offerType: "upgrade_pass",
      note: "Upgrade from preview access to the monthly pass.",
    },
  },
  soldOutModal: {
    headline: "Today\u2019s access passes are sold out",
    body: "The current Raph\u2019s Market preview batch has sold out. Join the list and we\u2019ll email you when the next access window opens.",
    ctaLabel: "Join the access list",
  },
} as const;
