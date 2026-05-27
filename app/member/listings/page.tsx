import type { Metadata } from "next";
import Link from "next/link";

import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { ListingsFilterBar, type ListingFilterState } from "@/components/listings/ListingsFilterBar";
import { ListingsGrid } from "@/components/listings/ListingsGrid";
import type { ListingCardViewModel } from "@/components/listings/ListingCard";
import { MembershipPreviewBlock } from "@/components/preview/MembershipPreviewBlock";
import { getActiveAccess } from "@/lib/domain/access/getActiveAccess";
import { campaign001Route } from "@/lib/domain/campaigns/config";
import { getLiveListings, type LiveListingFilters } from "@/lib/domain/listings/queries";
import { getCurrentMemberProfile } from "@/lib/domain/members/getCurrentMemberProfile";
import { site } from "@/lib/site";

type MemberListingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Member Listings | ${site.name}`,
  description: `Members-only deck listings for ${site.name}.`,
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parseFilters(params: Record<string, string | string[] | undefined>): ListingFilterState {
  return {
    brand: getParam(params, "brand"),
    condition: getParam(params, "condition"),
    era: getParam(params, "era"),
    priceRange: getParam(params, "priceRange"),
  };
}

function toLiveListingFilters(filters: ListingFilterState): LiveListingFilters {
  const liveFilters: LiveListingFilters = {
    brand: filters.brand || null,
    condition: filters.condition || null,
    era: filters.era || null,
    limit: 60,
  };

  if (filters.priceRange === "under-250") {
    liveFilters.maxPriceCents = 25000;
  }

  if (filters.priceRange === "250-350") {
    liveFilters.minPriceCents = 25000;
    liveFilters.maxPriceCents = 35000;
  }

  if (filters.priceRange === "350-plus") {
    liveFilters.minPriceCents = 35000;
  }

  if (filters.priceRange === "poa") {
    liveFilters.priceMode = "poa";
  }

  return liveFilters;
}

function mapListing(listing: Awaited<ReturnType<typeof getLiveListings>>[number]): ListingCardViewModel {
  return {
    brand: listing.brand,
    conditionLabel: listing.condition_label,
    currency: listing.currency,
    deckYear: listing.deck_year,
    era: listing.era,
    factsJson: listing.facts_json,
    id: listing.id,
    locationRegion: listing.location_region,
    priceCents: listing.price_cents,
    primaryImageUrl: listing.primary_image_url,
    slug: listing.slug,
    title: listing.title,
  };
}

function SignedOutState() {
  return (
    <main className="min-h-screen bg-cream px-5 py-10 text-ink sm:px-8 lg:px-12">
      <PageViewTracker eventName="member_listings_viewed" properties={{ access_state: "signed_out", surface: "member_listings" }} />
      <section className="mx-auto grid max-w-3xl gap-6">
        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Member listings</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-ink">Log in to view private listings</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
            Log in with the same email you used at checkout. Active Daypass or Ultra access is required before listing
            data is loaded.
          </p>
          <Link
            className="mt-6 inline-flex rounded-md bg-ink px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
            href="/member/login"
          >
            Log in or create account
          </Link>
        </div>
        <MembershipPreviewBlock ctaHref={campaign001Route} ctaLabel="Get a Daypass" surface="member" />
      </section>
    </main>
  );
}

function NoAccessState({ needsActivation }: { needsActivation: boolean }) {
  return (
    <main className="min-h-screen bg-cream px-5 py-10 text-ink sm:px-8 lg:px-12">
      <PageViewTracker
        eventName="member_listings_viewed"
        properties={{
          access_state: needsActivation ? "needs_activation" : "no_access",
          surface: "member_listings",
        }}
      />
      <section className="mx-auto grid max-w-3xl gap-6">
        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Member listings</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-ink">
            {needsActivation ? "Activate your Daypass first" : "Daypass or Ultra access required"}
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
            {needsActivation
              ? "Your purchased Daypass is waiting on the member dashboard. Activate it there, then return to browse listings."
              : "The Monroes listing set is private. Buy a Daypass or use an active Ultra membership before listings are fetched."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex rounded-md bg-ink px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
              href={needsActivation ? "/member" : campaign001Route}
            >
              {needsActivation ? "Go to dashboard" : "Get a Daypass"}
            </Link>
            <Link
              className="inline-flex rounded-md border border-ink/10 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink transition hover:border-orange hover:text-orange"
              href="/member"
            >
              Member dashboard
            </Link>
          </div>
        </div>
        <MembershipPreviewBlock ctaHref={campaign001Route} ctaLabel="Preview access" surface="member" />
      </section>
    </main>
  );
}

export default async function MemberListingsPage({ searchParams }: MemberListingsPageProps) {
  const memberProfile = await getCurrentMemberProfile();

  if (!memberProfile) {
    return <SignedOutState />;
  }

  const access = await getActiveAccess(memberProfile.id);

  if (!access.hasAccess) {
    return <NoAccessState needsActivation={access.needsActivation} />;
  }

  const resolvedSearchParams = await searchParams;
  const filters = parseFilters(resolvedSearchParams);
  const listings = (await getLiveListings(toLiveListingFilters(filters))).map(mapListing);

  return (
    <main className="min-h-screen bg-cream px-5 py-10 text-ink sm:px-8 lg:px-12">
      <PageViewTracker
        eventName="member_listings_viewed"
        properties={{
          access_type: access.accessType,
          active_filters: Object.values(filters).filter(Boolean).length,
          listing_count: listings.length,
          surface: "member_listings",
        }}
      />
      <section className="mx-auto grid max-w-7xl gap-6">
        <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Member listings</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink">Private Monroes deck listings</h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-ink/68">
              Member-only Monroes and consignment listings. No seller profiles, saved decks, cart, or listing submissions
              in this preview.
            </p>
          </div>
          <Link
            className="inline-flex rounded-md border border-ink/10 bg-cream px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink transition hover:border-orange hover:text-orange"
            href="/member"
          >
            Dashboard
          </Link>
        </div>

        <ListingsFilterBar filters={filters} />
        <ListingsGrid listings={listings} />
      </section>
    </main>
  );
}
