import rawWesternSkateCoListings from "./western-skateco-monroes-listing-seed.json";

import type { Database, Json } from "@/lib/types/database";

type ListingSeed = Database["public"]["Tables"]["listings"]["Insert"];

const placeholderImageUrls = [
  "/images/listings/placeholder-deck.svg",
  "/images/listings/placeholder-deck-side.svg",
  "/images/listings/placeholder-deck-detail.svg",
];

const sourceListings = rawWesternSkateCoListings as unknown as ListingSeed[];

function asFactsRecord(factsJson: Json | undefined) {
  if (!factsJson || typeof factsJson !== "object" || Array.isArray(factsJson)) {
    return {};
  }

  return factsJson;
}

export const westernSkateCoListings = sourceListings.map((listing): ListingSeed => {
  const factsJson = asFactsRecord(listing.facts_json);

  return {
    ...listing,
    status: "live",
    primary_image_url: placeholderImageUrls[0],
    facts_json: {
      ...factsJson,
      assetStatus: "placeholder_image_pending_manual_product_photos",
      copyStatus: "western_skate_co_import_live_member_listing",
      displayImageUrls: placeholderImageUrls,
      imageReplacementNeeded: true,
      monroesOwned: false,
      placeholderImageUrls,
      supplyTypeLabel: "Consignment",
      westernSkateCoSupplied: true,
    },
  };
});
