export const site = {
  name: "Raph\u2019s Market",
  description: "Private access to OG, rare, vintage, and interesting skateboard decks.",
  market: "Australia",
  currency: "AUD",
  offers: {
    previewPass: {
      name: "1-Day Preview Pass",
      price: "$4.99 AUD",
      note: "A short look inside the private marketplace concept.",
    },
    monthlyPass: {
      name: "Monthly Marketplace Pass",
      price: "$24.99 AUD/month",
      note: "Ongoing access for buyers who want the full private market.",
    },
    previewUpgrade: {
      name: "Preview Pass Upgrade",
      price: "$20 AUD",
      note: "Upgrade from preview access to the monthly pass.",
    },
  },
} as const;
