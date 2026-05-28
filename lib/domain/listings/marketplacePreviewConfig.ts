export type MembershipPreviewTile = {
  brand: string;
  title: string;
  imageUrl: string;
  alt: string;
  tone: "orange" | "mint" | "lilac";
};

export type MembershipPreviewStat = {
  label: string;
  value: string;
};

export const membershipPreviewConfig = {
  eyebrow: "Sneak peek",
  title: "What's for sale?",
  body: null,
  tiles: [
    {
      alt: "Placeholder preview for a vintage skateboard deck listing",
      brand: "Santa Cruz",
      imageUrl: "/images/listings/placeholder-deck.svg",
      title: "Deck Jason Jessee Sungod Metallic 9.9\u201d x 29.1\u201d",
      tone: "orange",
    },
    {
      alt: "Placeholder preview for a private skateboard deck listing",
      brand: "Santa Cruz",
      imageUrl: "/images/listings/placeholder-deck.svg",
      title: "Deck Jason Jessee Sungod Metallic 9.9\u201d x 29.1\u201d",
      tone: "mint",
    },
  ],
  stats: [
    {
      label: "Region",
      value: "Based In Australia",
    },
  ],
} as const;
