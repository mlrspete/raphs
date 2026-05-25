import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LandingPageRenderer } from "@/components/landing/LandingPageRenderer";
import { campaign001Slug } from "@/lib/domain/campaigns/config";
import { getPublicCampaignProgress } from "@/lib/domain/campaigns/publicProgress";
import { getLandingPageBySlug } from "@/lib/db/landing-tests";
import { getCampaign001LandingFallback, isCampaign001LandingSlug } from "@/lib/landing-tests/campaign001Fallback";
import { site } from "@/lib/site";

type LandingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

const landingMetaTitle = "Monroes Daypass Promotion";
const landingMetaDescription =
  "Get a Monroes Daypass, browse the members-only deck market, and receive free entry into the Sun God deck promotion with each eligible Daypass.";

export async function generateMetadata({ params }: LandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = isCampaign001LandingSlug(slug)
    ? getCampaign001LandingFallback(slug)
    : await getLandingPageBySlug(slug);

  if (!page) {
    return {
      title: site.name,
      description: site.description,
    };
  }

  return {
    title: `${landingMetaTitle} | ${site.name}`,
    description: landingMetaDescription,
  };
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { slug } = await params;
  const page = isCampaign001LandingSlug(slug)
    ? getCampaign001LandingFallback(slug)
    : await getLandingPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const campaignProgress = isCampaign001LandingSlug(slug)
    ? await getPublicCampaignProgress({
        publicEntryLimit: page.campaignLimit,
        slug: campaign001Slug,
      })
    : null;

  return <LandingPageRenderer campaignProgress={campaignProgress} page={page} />;
}
