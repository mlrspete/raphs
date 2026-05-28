import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Footer } from "@/components/marketing/Footer";
import { getCampaignBySlug } from "@/lib/domain/campaigns/queries";
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
  { key: "starts_at", label: "Campaign opens" },
  { key: "closes_at", label: "Campaign closes" },
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
    title: `Promo rules | ${site.name}`,
    description:
      "These rules explain how the Monroes Sun God Daypass promotion works, including eligibility, entry allocation, friend code attribution, draw timing, refunds, and winner handling.",
  };
}

export default async function PromoRulesPage({ params }: PromoRulesPageProps) {
  const { slug } = await params;
  const campaign = getPublicCampaignContent(slug);

  if (!campaign) {
    notFound();
  }

  const campaignRecord = await getCampaignBySlug(campaign.slug);
  const timings = {
    closes_at: campaignRecord?.closes_at ?? campaign.timings.closes_at,
    draw_at: campaignRecord?.draw_at ?? campaign.timings.draw_at,
    draw_lock_at: campaignRecord?.draw_lock_at ?? campaign.timings.draw_lock_at,
    entries_close_at: campaignRecord?.entries_close_at ?? campaign.timings.entries_close_at,
    starts_at: campaignRecord?.starts_at ?? campaign.timings.starts_at,
  } satisfies Record<CampaignTimingKey, string | null>;

  return (
    <main className="bg-cream text-ink">
      <section className="mx-auto grid max-w-5xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Promotion Rules</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Promo rules</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
            These rules explain how the Monroes Sun God Daypass promotion works, including eligibility, entry allocation,
            friend code attribution, draw timing, refunds, and winner handling. Final legal and operator review is
            required before launch.
          </p>
        </div>

        <RuleSection title="Promoter Details">
          <p>Promoter: Monroes. MLRS GG PTY LTD, ACN: 687 632 104, Suite 280 / 530 Little Collins Street, Melbourne, VIC 3000.</p>
          <p>Support contact: contact@monroes.au</p>
        </RuleSection>

        <RuleSection title="Eligibility and Scope">
          <p>This promotion is only available to Australian residents aged 18 and over.</p>
          <p>Eligibility may be subject to final state, territory, permit, and trade-promotion requirements before launch.</p>
        </RuleSection>

        <RuleSection title="Campaign Timing">
          <div className="grid gap-3 md:grid-cols-5">
            {timingRows.map((row) => (
              <div className="rounded-lg border border-ink/10 bg-cream p-3" key={row.key}>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/45">{row.label}</p>
                <p className="mt-2 text-sm font-black leading-6 text-ink">{formatCampaignDateTime(timings[row.key])}</p>
              </div>
            ))}
          </div>
          <p>
            Entries close when the campaign reaches its entry cap. If the published countdown reaches zero before all
            eligible entries are allocated, the close time may roll forward by 24 hours and the countdown may continue
            from the extended close time. This may repeat until the entry cap is reached or Monroes manually closes the
            promotion. Draw lock is the point where the eligible entry list is frozen and friend-code redemptions can no
            longer change the promotional entry holder.
          </p>
        </RuleSection>

        <RuleSection title="Prize Description and Value">
          <p>Promotional prize: 2016 Santa Cruz Jason Jessee Purple Pearlescent Sun God skateboard deck in new condition.</p>
          <p>Prize value: AUD [insert final verified value before launch]. Final value evidence and prize condition details must be confirmed before launch.</p>
        </RuleSection>

        <RuleSection title="Entry Method">
          <p>Eligible Daypass purchases receive free entry into the promotion.</p>
          <p>
            Daypass purchase limit: maximum 10 Daypasses per order. Each eligible Daypass in an order may receive one
            free promotional entry, subject to final eligibility, cancellation, refund, and timing rules.
          </p>
          <p>Entries are not sold separately.</p>
        </RuleSection>

        <RuleSection title="Friend Codes and Attribution">
          <p>
            One Daypass is for purchaser access. Additional Daypasses create friend codes. Unredeemed friend codes keep
            their related promotional entry held by the purchaser by default.
          </p>
          <p>
            If a friend redeems a valid code before draw lock, the linked promotional entry holder can update to the
            redeemer. If redemption happens at or after draw lock, valid codes may still grant Daypass access, but
            promotional entry attribution does not transfer.
          </p>
        </RuleSection>

        <RuleSection id="provably-fair" title="Provably Fair Draw">
          <p>
            Before the draw, Monroes will freeze the eligible entry list and create a draw snapshot. The snapshot records
            the final eligible entry range without publishing private customer information.
          </p>
          <p>
            Monroes will generate and record a snapshot hash before the winner is selected. This hash allows the final
            entry list to be checked against the locked draw snapshot after the draw has been completed.
          </p>
          <p>
            The winner will be selected live from the locked entry range using a transparent random-number draw. The
            winning number will match one entry in the frozen snapshot.
          </p>
          <p>
            Public draw results will not publish entrant emails, full names, payment identifiers, access codes, code
            hashes, or private purchaser information.
          </p>
        </RuleSection>

        <RuleSection title="Draw, Winner, and Redraw">
          <p>
            After entries close under the published countdown, including any rolling 24-hour extension, and the draw
            snapshot is locked, Monroes will conduct the draw using the published draw method and the final eligible
            entry range.
          </p>
          <p>
            The winner will be notified in writing using the contact details connected to the winning entry. Monroes will
            publish the public draw result after the draw has been completed and recorded.
          </p>
          <p>
            The prize claim window, redraw timing, delivery process, and any unclaimed-prize handling must be finalised
            before launch and reflected in these rules.
          </p>
        </RuleSection>

        <RuleSection title="Refunds, Cancellations, and Access">
          <p>Refunded or cancelled Daypasses may revoke access and may void related promotional entries.</p>
          <p>
            For Daypasses attached to this promotion, refund requests should be made before the promotion closes. After
            the promotion closes, change-of-mind refunds may not be available. This does not limit any rights customers
            may have under Australian Consumer Law.
          </p>
          <p>
            If a Daypass is refunded before draw lock, any related promotional entry may be cancelled, voided, or marked
            ineligible according to the final promotion rules.
          </p>
        </RuleSection>

        <RuleSection title="No Affiliation and Privacy">
          <p>
            No affiliation, endorsement, sponsorship, or approval by Santa Cruz, Jason Jessee, Jim Phillips, any prize
            brand, manufacturer, rider, or rights holder is implied unless Monroes publishes verified approval before
            launch.
          </p>
          <p>
            Personal information is handled according to the{" "}
            <Link className="font-black text-orange underline underline-offset-4" href="/privacy">
              privacy notice
            </Link>
            . See also the{" "}
            <Link className="font-black text-orange underline underline-offset-4" href="/terms">
              site terms
            </Link>{" "}
            and{" "}
            <Link className="font-black text-orange underline underline-offset-4" href="/refund-policy">
              refund policy
            </Link>
            .
          </p>
        </RuleSection>
      </section>
      <Footer />
    </main>
  );
}

function RuleSection({ children, id, title }: { children: ReactNode; id?: string; title: string }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft" id={id}>
      <h2 className="text-2xl font-black leading-tight text-ink">{title}</h2>
      <div className="mt-4 grid gap-4 text-base font-semibold leading-7 text-ink/68">{children}</div>
    </section>
  );
}
