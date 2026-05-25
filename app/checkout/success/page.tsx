import type { Metadata } from "next";
import Link from "next/link";

import { MembershipPreviewBlock } from "@/components/preview/MembershipPreviewBlock";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Checkout Success | ${site.name}`,
  description: `Checkout confirmation for ${site.name}.`,
};

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-cream px-5 py-10 text-ink sm:px-8 lg:px-12">
      <section className="mx-auto grid max-w-4xl gap-6">
        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Checkout</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-ink">Payment is being confirmed</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
            You have been redirected back to Monroes. This page does not fulfil access by itself. We confirm payment
            through our processor, then link your Daypass, friend codes, and promotional entries to the checkout email.
          </p>
          <p className="mt-3 text-base font-semibold leading-7 text-ink/68">
            Check your email for confirmation. When you log in, use the same email you used at checkout.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex rounded-md bg-ink px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
              href="/member"
            >
              Go to member dashboard
            </Link>
            <Link
              className="inline-flex rounded-md border border-ink/10 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink transition hover:border-orange hover:text-orange"
              href="/"
            >
              Back to Monroes
            </Link>
          </div>
        </div>
        <MembershipPreviewBlock ctaHref="/member" ctaLabel="Open dashboard" surface="member" />
      </section>
    </main>
  );
}
