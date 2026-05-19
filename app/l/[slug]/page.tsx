import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LandingPageRenderer } from "@/components/landing/LandingPageRenderer";
import { getLandingPageBySlug } from "@/lib/db/landing-tests";
import { getCampaign001LandingFallback } from "@/lib/landing-tests/campaign001Fallback";
import { site } from "@/lib/site";

type LandingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

const landingMetaTitle = "Monroes Daypass Promotion";
const landingMetaDescription =
  "Get a Monroes Daypass, browse the member-only deck market, and receive free promo entry with an eligible Daypass purchase.";

export async function generateMetadata({ params }: LandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = (await getLandingPageBySlug(slug)) ?? getCampaign001LandingFallback(slug);

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
  const page = (await getLandingPageBySlug(slug)) ?? getCampaign001LandingFallback(slug);

  if (!page) {
    notFound();
  }

  return <LandingPageRenderer page={page} />;
}
