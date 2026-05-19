import { ListingCard, type ListingCardViewModel } from "@/components/listings/ListingCard";

type ListingsGridProps = {
  listings: ListingCardViewModel[];
};

export function ListingsGrid({ listings }: ListingsGridProps) {
  if (listings.length === 0) {
    return (
      <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
        <p className="text-sm font-black uppercase tracking-[0.12em] text-orange">No listings found</p>
        <p className="mt-3 text-base font-semibold leading-7 text-ink/68">
          Try clearing a filter. The member inventory is intentionally small while Monroes verifies the first deck set.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
