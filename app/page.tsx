import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { FAQ } from "@/components/marketing/FAQ";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { MarketplacePreview } from "@/components/marketing/MarketplacePreview";
import { OfferCards } from "@/components/marketing/OfferCards";
import { PreferencePrompt } from "@/components/marketing/PreferencePrompt";

export default function Home() {
  return (
    <main className="overflow-hidden bg-cream text-ink">
      <PageViewTracker eventName="homepage_viewed" properties={{ surface: "homepage" }} />
      <Hero />
      <OfferCards />
      <MarketplacePreview />
      <HowItWorks />
      <PreferencePrompt />
      <FAQ />
      <Footer />
    </main>
  );
}
