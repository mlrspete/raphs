export const site = {
  name: "Monroes",
  description: "Private access to OG, rare, vintage, and interesting skateboard decks.",
  market: "Australia",
  currency: "AUD",
  offers: {
    previewPass: {
      name: "Daypass",
      price: "$4.99 AUD",
      priceCents: 499,
      offerId: "homepage_preview_pass",
      offerType: "preview_pass",
      note: "A short look inside the members market.",
    },
    monthlyPass: {
      name: "Monroes Ultra",
      price: "$24.99 AUD/month",
      priceCents: 2499,
      offerId: "homepage_monthly_pass",
      offerType: "monthly_pass",
      note: "Ongoing access for buyers who want the members market.",
    },
    previewUpgrade: {
      name: "Monroes Ultra Upgrade",
      price: "$20 AUD",
      priceCents: 2000,
      offerId: "homepage_preview_upgrade",
      offerType: "upgrade_pass",
      note: "Upgrade from Daypass access to Monroes Ultra.",
    },
  },
  soldOutModal: {
    headline: "Today\u2019s access passes are sold out",
    body: "The current Monroes preview batch has sold out. Join the list and we\u2019ll email you when more places become available.",
    ctaLabel: "Join the access list",
  },
} as const;
