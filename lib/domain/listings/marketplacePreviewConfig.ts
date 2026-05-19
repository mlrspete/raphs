export type MembershipPreviewTile = {
  title: string;
  meta: string;
  imageUrl: string;
  alt: string;
  tone: "orange" | "mint" | "lilac";
};

export type MembershipPreviewStat = {
  label: string;
  value: string;
};

export const membershipPreviewConfig = {
  eyebrow: "Member deck market",
  title: "A private preview of Monroes-owned decks.",
  body:
    "Monroes is a small private member deck market for rare, older, odd, and display-worthy boards. It is curated by Monroes, not an open seller marketplace.",
  tiles: [
    {
      alt: "Placeholder preview for a vintage skateboard deck listing",
      imageUrl: "/images/listings/placeholder-deck.svg",
      meta: "Vintage pool shape",
      title: "Older graphics",
      tone: "orange",
    },
    {
      alt: "Placeholder preview for a private skateboard deck listing",
      imageUrl: "/images/listings/placeholder-deck.svg",
      meta: "Member-only browse",
      title: "Private listings",
      tone: "mint",
    },
    {
      alt: "Placeholder preview for a collectible skateboard deck listing",
      imageUrl: "/images/listings/placeholder-deck.svg",
      meta: "Display-ready finds",
      title: "Collector energy",
      tone: "lilac",
    },
  ],
  stats: [
    {
      label: "Decks",
      value: "400+",
    },
    {
      label: "Brands",
      value: "27",
    },
    {
      label: "Oldest deck",
      value: "1977",
    },
    {
      label: "Region",
      value: "Australia only",
    },
  ],
} as const;
