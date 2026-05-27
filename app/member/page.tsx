import type { Metadata } from "next";
import Link from "next/link";

import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { DaypassCodeList } from "@/components/member/DaypassCodeList";
import { MemberAuthHashErrorRedirect } from "@/components/member/MemberAuthHashErrorRedirect";
import { DrawProcessCard } from "@/components/member/DrawProcessCard";
import { MemberAccessStatusCard } from "@/components/member/MemberAccessStatusCard";
import { MemberOrderHistory } from "@/components/member/MemberOrderHistory";
import { MemberSignOutButton } from "@/components/member/MemberSignOutButton";
import { PromoEntriesCard } from "@/components/member/PromoEntriesCard";
import { MembershipPreviewBlock } from "@/components/preview/MembershipPreviewBlock";
import { getActiveAccess } from "@/lib/domain/access/getActiveAccess";
import { campaign001, campaign001Route, campaign001Slug } from "@/lib/domain/campaigns/config";
import { getCampaignBySlug } from "@/lib/domain/campaigns/queries";
import { getCurrentMemberProfile } from "@/lib/domain/members/getCurrentMemberProfile";
import {
  getMemberCodeSummary,
  getMemberEntrySummary,
  getMemberOrdersSummary,
} from "@/lib/domain/members/summaries";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Member | ${site.name}`,
  description: `Member access for ${site.name}.`,
};

function formatTimeRemaining(expiresAt: string | null) {
  if (!expiresAt) {
    return null;
  }

  const remainingMs = Date.parse(expiresAt) - Date.now();

  if (remainingMs <= 0) {
    return "Expired";
  }

  const totalMinutes = Math.ceil(remainingMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  return `${minutes}m remaining`;
}

export default async function MemberPage() {
  const memberProfile = await getCurrentMemberProfile();

  if (!memberProfile) {
    return (
      <main className="min-h-screen bg-cream px-5 py-10 text-ink sm:px-8 lg:px-12">
        <MemberAuthHashErrorRedirect />
        <section className="mx-auto grid max-w-3xl gap-6">
          <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Member dashboard</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink">Log in to access Monroes</h1>
            <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
              Log in with the same email you used at checkout. Monroes links your member profile, membership access,
              access codes, and any promotional entries to that email.
            </p>
            <Link
              className="mt-6 inline-flex rounded-md bg-ink px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
              href="/member/login"
            >
              Log in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const [access, orders, codes, entries, campaign] = await Promise.all([
    getActiveAccess(memberProfile.id),
    getMemberOrdersSummary(memberProfile.id),
    getMemberCodeSummary(memberProfile.id),
    getMemberEntrySummary(memberProfile.id),
    getCampaignBySlug(campaign001Slug),
  ]);
  const campaignDisplay = campaign ?? campaign001;
  const totalDaypassQuantity = orders.reduce((sum, order) => sum + order.daypassQuantity, 0);
  const hasWebhookPendingOrder =
    !access.hasAccess &&
    !access.needsActivation &&
    orders.some((order) => order.status === "pending" || order.status === "paid");
  const timeRemainingLabel = formatTimeRemaining(access.expiresAt);

  return (
    <main className="min-h-screen bg-cream px-5 py-10 text-ink sm:px-8 lg:px-12">
      <MemberAuthHashErrorRedirect />
      <PageViewTracker
        eventName="member_dashboard_viewed"
        properties={{
          access_type: access.accessType,
          daypass_code_count: codes.length,
          has_access: access.hasAccess,
          needs_activation: access.needsActivation,
          order_count: orders.length,
          promo_entry_count: entries.length,
          surface: "member_dashboard",
        }}
      />
      <section className="mx-auto grid max-w-6xl gap-6">
        <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Member</p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-ink">Monroes member dashboard</h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-ink/68">
              Signed in as {memberProfile.email}. Your profile, purchases, Daypass access, friend Daypass codes, and promo
              entries are linked by your authenticated email.
            </p>
          </div>
          <MemberSignOutButton />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <MemberAccessStatusCard
            access={access}
            campaignHref={campaign001Route}
            daypassQuantity={totalDaypassQuantity}
            hasWebhookPendingOrder={hasWebhookPendingOrder}
            timeRemainingLabel={timeRemainingLabel}
          />
          <PromoEntriesCard entries={entries} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <MemberOrderHistory orders={orders} />
          <DaypassCodeList codes={codes} />
        </div>

        <DrawProcessCard
          campaignName={campaignDisplay.short_name ?? campaignDisplay.name}
          drawAt={campaignDisplay.draw_at ?? null}
          drawLockAt={campaignDisplay.draw_lock_at ?? null}
          entriesCloseAt={campaignDisplay.entries_close_at ?? null}
          rulesHref={campaignDisplay.rules_url ?? null}
        />

        <article className="rounded-lg border border-ink/10 bg-dark p-6 text-white shadow-soft sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Listings</p>
          <h2 className="mt-3 text-2xl font-black leading-tight">Member listings</h2>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/72">
            Browse the first Monroes-owned listing set once your Daypass or Ultra access is active.
          </p>
          <Link
            className="mt-5 inline-flex rounded-md bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink transition hover:bg-peach focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2 focus:ring-offset-dark"
            href="/member/listings"
          >
            Open member listings
          </Link>
        </article>

        {!access.hasAccess ? (
          <MembershipPreviewBlock ctaHref={campaign001Route} ctaLabel="Get a Daypass" surface="member" />
        ) : null}
      </section>
    </main>
  );
}
