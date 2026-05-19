import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Footer } from "@/components/marketing/Footer";
import {
  formatCampaignDateTime,
  getPublicCampaignContent,
  type CampaignTimingKey,
} from "@/lib/domain/campaigns/publicContent";
import { site } from "@/lib/site";

type PromoRulesPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const timingRows: { key: CampaignTimingKey; label: string }[] = [
  { key: "starts_at", label: "Campaign start" },
  { key: "closes_at", label: "Campaign close" },
  { key: "entries_close_at", label: "Entries close" },
  { key: "draw_lock_at", label: "Draw lock" },
  { key: "draw_at", label: "Planned draw" },
];

export async function generateMetadata({ params }: PromoRulesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = getPublicCampaignContent(slug);

  if (!campaign) {
    return {
      title: `Promo Rules | ${site.name}`,
    };
  }

  return {
    title: `${campaign.shortName} Promo Rules | ${site.name}`,
    description: `Draft promotion rules for ${campaign.name}.`,
  };
}

export default async function PromoRulesPage({ params }: PromoRulesPageProps) {
  const { slug } = await params;
  const campaign = getPublicCampaignContent(slug);

  if (!campaign) {
    notFound();
  }

  return (
    <main className="bg-cream text-ink">
      <section className="mx-auto grid max-w-5xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Promotion Rules</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{campaign.shortName} draft rules</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
            These are launch-readiness rules placeholders for Monroes. Operator and legal review must replace all
            placeholder details before paid promotion.
          </p>
        </div>

        <RuleSection title="Promoter Details">
          <p>Promoter: Monroes. Final legal entity, ABN/ACN if applicable, address, and support contact are operator-supplied launch details.</p>
          <p>Support contact placeholder: {campaign.supportEmailLabel}.</p>
        </RuleSection>

        <RuleSection title="Eligibility and Scope">
          <p>{campaign.eligibilitySummary}</p>
          <p>
            Intended geographic scope: Australia, including eligible states and territories subject to final permit,
            authority, and trade-promotion review.
          </p>
        </RuleSection>

        <RuleSection title="Campaign Timing">
          <div className="grid gap-3 md:grid-cols-5">
            {timingRows.map((row) => (
              <div className="rounded-lg border border-ink/10 bg-cream p-3" key={row.key}>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/45">{row.label}</p>
                <p className="mt-2 text-sm font-black leading-6 text-ink">{formatCampaignDateTime(campaign.timings[row.key])}</p>
              </div>
            ))}
          </div>
          <p>
            Timing definitions: entries close controls when new promo entries stop being issued; draw lock controls when
            friend-code redemption can no longer change promo entry attribution; draw time is the planned public draw.
          </p>
        </RuleSection>

        <RuleSection title="Prize Description and Value">
          <p>{campaign.prizeTitle}: {campaign.prizeDescription}</p>
          <p>Prize value: {campaign.prizeValueDisplay}. Final value evidence and prize condition details are required before launch.</p>
        </RuleSection>

        <RuleSection title="Entry Method">
          <p>{campaign.entryWording}</p>
          <p>
            Daypass purchase limit: maximum 10 Daypasses per order. Each eligible Daypass in an order may receive one
            free promo entry, subject to final eligibility, cancellation, refund, and timing rules.
          </p>
          <p>
            Monroes must finalise any per-person, per-household, or per-order entry caps before launch. Entries must not
            be presented as a product sold separately.
          </p>
        </RuleSection>

        <RuleSection title="Friend Codes and Attribution">
          <p>
            One Daypass is for purchaser access. Additional Daypasses create friend codes. Unredeemed friend codes keep
            their related promo entry held by the purchaser by default.
          </p>
          <p>
            If a friend redeems a valid code before draw lock, the linked promo entry current holder can update to the
            redeemer. If redemption happens at or after draw lock, valid codes may still grant Daypass access, but promo
            entry attribution does not transfer.
          </p>
        </RuleSection>

        <RuleSection title="Draw, Winner, and Redraw">
          <p>
            Monroes should create a frozen entry snapshot before the draw. Final draw location, draw method, independent
            supervision if required, winner notification, public result publication, prize claim timeframe, delivery
            process, and redraw/unclaimed prize process must be approved before launch.
          </p>
        </RuleSection>

        <RuleSection title="Refunds, Cancellations, and Access">
          <p>
            Refunded or cancelled Daypasses may revoke access and may void related promo entries. Final refund and entry
            voiding rules must be settled before launch and reflected in the{" "}
            <Link className="font-black text-orange underline underline-offset-4" href={campaign.refundUrl}>
              refund policy
            </Link>
            .
          </p>
        </RuleSection>

        <RuleSection title="No Affiliation and Privacy">
          <p>{campaign.noAffiliationDisclaimer}</p>
          <p>
            Personal information is handled according to the{" "}
            <Link className="font-black text-orange underline underline-offset-4" href={campaign.privacyUrl}>
              privacy notice
            </Link>
            . See also the{" "}
            <Link className="font-black text-orange underline underline-offset-4" href={campaign.termsUrl}>
              site terms
            </Link>
            .
          </p>
        </RuleSection>
      </section>
      <Footer />
    </main>
  );
}

function RuleSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="text-2xl font-black leading-tight text-ink">{title}</h2>
      <div className="mt-4 grid gap-4 text-base font-semibold leading-7 text-ink/68">{children}</div>
    </section>
  );
}
