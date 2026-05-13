import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Footer } from "@/components/marketing/Footer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms | ${site.name}`,
  description: `Terms for the ${site.name} V0 preview concept.`,
};

export default function TermsPage() {
  return (
    <main className="bg-cream text-ink">
      <section className="mx-auto grid max-w-4xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Terms</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{site.name} preview terms</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
            These terms describe the V0 demand-validation website for an Australia-only private skateboard deck
            marketplace concept.
          </p>
        </div>

        <TermsSection title="Preview concept">
          <p>
            {site.name} is not a live marketplace yet. The website is used to test interest in paid-access style offers
            and collect access-list demand signals.
          </p>
        </TermsSection>

        <TermsSection title="No payments or checkout">
          <p>
            The V0 does not process payments, create memberships, reserve inventory, run a cart, or complete checkout.
            CTA interactions may show sold-out access language and then invite you to join the access list.
          </p>
        </TermsSection>

        <TermsSection title="Australia only">
          <p>
            The concept, pricing, and access-list testing are intended for Australia. Prices shown on the site are in{" "}
            {site.currency}.
          </p>
        </TermsSection>

        <TermsSection title="Access list and marketing consent">
          <p>
            Joining the access list requires an email address and explicit marketing consent. Optional preferences help
            us understand what deck categories, budgets, and buyer/seller intent are most relevant.
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
