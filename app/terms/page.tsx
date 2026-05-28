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
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Monroes terms</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
            These terms explain Monroes access products, member access, promotional entries, checkout flows, refunds,
            privacy, and support. Final legal review is required before launch.
          </p>
        </div>

        <TermsSection title="Member deck market">
          <p>
            Monroes is a private member deck market concept for Monroes-owned or Monroes-curated listings. It is not an
            open marketplace for seller profiles, listing submissions, carts, auctions, or public inventory.
          </p>
        </TermsSection>

        <TermsSection title="Daypass and Monroes Ultra">
          <p>
            A Daypass is a paid, limited-time access product. Monroes Ultra is the intended ongoing membership tier.
          </p>
          <p>
            Daypass access starts only when activated from the member dashboard, not merely when checkout succeeds.
          </p>
        </TermsSection>

        <TermsSection title="Checkout and fulfilment">
          <p>
            The checkout processor may collect payment and email details. Fulfilment is confirmed by payment processing
            and Monroes access records, not by the checkout success redirect alone.
          </p>
        </TermsSection>

        <TermsSection title="Australia only">
          <p>
            The concept, pricing, promotions, and access-list testing are intended for Australia. Prices shown on the
            site are in AUD.
          </p>
        </TermsSection>

        <TermsSection title="Promotions and free entries">
          <p>
            Eligible Daypass purchases may receive free entry into a related Monroes promotion. Entries are not sold
            separately.
          </p>
          <p>
            Promotion mechanics, friend-code treatment, draw timing, winner notification, prize claim rules, and redraw
            rules are governed by the applicable promotion rules.
          </p>
          <p>
            Where a promotion uses a countdown, the close time may extend by 24 hours if the countdown reaches zero
            before all eligible entries are allocated, unless Monroes manually closes the promotion in line with the
            applicable promotion rules.
          </p>
        </TermsSection>

        <TermsSection title="Refunds and cancellations">
          <p>
            Refunds, duplicate purchase handling, access revocation, and promotional entry impacts are described in the{" "}
            <Link className="font-black text-orange underline underline-offset-4" href="/refund-policy">
              refund policy
            </Link>
            .
          </p>
        </TermsSection>

        <TermsSection title="Access, emails, and support">
          <p>
            Transactional emails may be sent for checkout confirmation, account or access instructions, access code
            delivery, code redemption notices, refund updates, and support recovery.
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
