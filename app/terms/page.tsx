import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Footer } from "@/components/marketing/Footer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms | ${site.name}`,
  description: `Terms for ${site.name} Daypass and member access.`,
};

export default function TermsPage() {
  return (
    <main className="bg-cream text-ink">
      <section className="mx-auto grid max-w-4xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Terms</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{site.name} terms</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
            These draft terms describe Monroes Daypass access, member access, promotion records, and checkout flows.
            Final legal review is required before launch.
          </p>
        </div>

        <TermsSection title="Member deck market">
          <p>
            {site.name} is a private member deck market concept for Monroes-owned or Monroes-curated listings. It is not
            an open marketplace for seller profiles, listing submissions, carts, auctions, or public inventory.
          </p>
        </TermsSection>

        <TermsSection title="Daypass and Monroes Ultra">
          <p>
            A Daypass is a paid, limited-time access product. Monroes Ultra is the intended membership tier. Daypass
            access starts only when activated from the member dashboard, not merely when checkout succeeds.
          </p>
          <p>
            Stripe Checkout may collect payment and email details. Fulfilment is confirmed by webhook processing, not by
            the checkout success redirect alone.
          </p>
        </TermsSection>

        <TermsSection title="Australia only">
          <p>
            The concept, pricing, and access-list testing are intended for Australia. Prices shown on the site are in{" "}
            {site.currency}.
          </p>
        </TermsSection>

        <TermsSection title="Promotions and free entries">
          <p>
            Eligible Daypass purchases receive free entry into the promotion. Entries are not sold separately. Any
            Campaign 001 entry mechanics, friend-code treatment, attribution lock timing, draw process, winner
            notification, and prize claim rules are governed by the applicable promo rules.
          </p>
          <p>
            Campaign 001 rules are available at{" "}
            <Link className="font-black text-orange underline underline-offset-4" href="/promo-rules/campaign-001">
              /promo-rules/campaign-001
            </Link>
            .
          </p>
        </TermsSection>

        <TermsSection title="Refunds and cancellations">
          <p>
            Daypass refunds, duplicate purchase handling, access revocation, and promo entry cancellation are described
            in the{" "}
            <Link className="font-black text-orange underline underline-offset-4" href="/refund-policy">
              refund policy
            </Link>
            . Final operator approval is required before launch.
          </p>
        </TermsSection>

        <TermsSection title="Access list, emails, and support">
          <p>
            Joining the access list requires an email address and marketing consent. Transactional emails may be sent for
            checkout confirmation, account/access instructions, Daypass code delivery, code redemption notices, refund
            updates, and support recovery.
          </p>
          <p>No SMS consent is collected.</p>
        </TermsSection>

        <TermsSection title="Privacy">
          <p>
            Details about collected data, analytics, attribution, and removal requests are available on the{" "}
            <Link className="font-black text-orange underline underline-offset-4" href="/privacy">
              privacy page
            </Link>
            .
          </p>
        </TermsSection>
      </section>
      <Footer />
    </main>
  );
}

function TermsSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="text-2xl font-black leading-tight text-ink">{title}</h2>
      <div className="mt-4 grid gap-4 text-base font-semibold leading-7 text-ink/68">{children}</div>
    </section>
  );
}
