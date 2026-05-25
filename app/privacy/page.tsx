import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Footer } from "@/components/marketing/Footer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy | ${site.name}`,
  description: `Privacy information for ${site.name}.`,
};

export default function PrivacyPage() {
  return (
    <main className="bg-cream text-ink">
      <section className="mx-auto grid max-w-4xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Privacy</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Monroes privacy notice</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
            Monroes is an Australia-only private member deck market concept for OG, rare, vintage, and interesting
            skateboard decks.
          </p>
        </div>

        <PolicySection title="What we collect">
          <p>
            We collect the email address you submit, your first name if provided, your deck preferences, budget range,
            buyer/seller intent, and likelihood to buy access when available.
          </p>
          <p>
            We also collect first-party attribution and analytics context such as anonymous visitor ID, session ID,
            landing page, offer, UTM parameters, Meta ad identifiers, device type, page path, referrer, and selected
            analytics events.
          </p>
          <p>
            If you make a purchase, we may collect payment-related records such as checkout identifiers, order status,
            purchase quantity, purchaser email, transactional email status, member access status, access code status, and
            promo entry records. We do not store card numbers.
          </p>
        </PolicySection>

        <PolicySection title="How we use it">
          <p>
            We use payment, member, access, and promo-entry records to confirm purchases, issue access, send
            transactional emails, support code recovery, operate promotion records, and respond to support requests.
          </p>
          <p>No SMS consent is requested or collected.</p>
        </PolicySection>

        <PolicySection title="Analytics and advertising">
          <p>
            We use analytics tools to understand product behaviour and paid-ad performance. Full access codes, code
            hashes, encrypted code payloads, and transaction details will never be sent to analytics tools.
          </p>
        </PolicySection>

        <PolicySection title="Transactional emails">
          <p>
            Monroes may send transactional emails for purchase confirmation, access instructions, access code delivery,
            code redemption notices, refund/cancellation updates, and support recovery. Marketing email consent is
            handled separately from necessary transactional messages.
          </p>
        </PolicySection>

        <PolicySection title="Access, removal, and unsubscribe">
          <p>
            You can request removal from the access list or ask us to stop marketing emails. Automated unsubscribe and
            support flows may be added over time; for now, use the support contact email contact@monroes.au.
          </p>
        </PolicySection>

        <PolicySection title="Terms">
          <p>
            See the{" "}
            <Link className="font-black text-orange underline underline-offset-4" href="/terms">
              terms page
            </Link>{" "}
            and{" "}
            <Link className="font-black text-orange underline underline-offset-4" href="/refund-policy">
              refund policy
            </Link>{" "}
            for more detail.
          </p>
        </PolicySection>
      </section>
      <Footer />
    </main>
  );
}

function PolicySection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="text-2xl font-black leading-tight text-ink">{title}</h2>
      <div className="mt-4 grid gap-4 text-base font-semibold leading-7 text-ink/68">{children}</div>
    </section>
  );
}
