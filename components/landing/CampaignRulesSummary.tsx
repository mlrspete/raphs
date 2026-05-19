import Link from "next/link";

import { campaign001PublicContent } from "@/lib/domain/campaigns/publicContent";

export function CampaignRulesSummary() {
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
        <div>
          <p className="landing-card-eyebrow">Entry Mechanics</p>
          <h2 className="landing-section-title mt-3">Daypass access first, promo entry second.</h2>
          <p className="landing-body mt-4">{campaign001PublicContent.entryWording}</p>
          <p className="landing-body mt-4">
            The Daypass is a paid access product. Promo entries are attached as a free promotional benefit for eligible
            Daypass purchases, subject to final rules.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="landing-button inline-flex rounded-[10px] bg-ink px-5 py-3 text-white hover:bg-orange" href={campaign001PublicContent.rulesUrl}>
              Promo rules
            </Link>
            <Link className="landing-button inline-flex rounded-[10px] border border-ink/10 bg-white px-5 py-3 text-ink hover:border-orange hover:text-orange" href={campaign001PublicContent.refundUrl}>
              Refund policy
            </Link>
          </div>
        </div>

        <div className="grid gap-3">
          {campaign001PublicContent.mechanics.map((item) => (
            <p className="rounded-lg border border-ink/10 bg-cream p-4 text-sm font-bold leading-6 text-ink/68" key={item}>
              {item}
            </p>
          ))}
          <p className="rounded-lg border border-orange/25 bg-orange/10 p-4 text-sm font-bold leading-6 text-ink/70">
            {campaign001PublicContent.noAffiliationDisclaimer}
          </p>
        </div>
      </div>
    </section>
  );
}
