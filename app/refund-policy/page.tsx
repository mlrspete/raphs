import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Footer } from "@/components/marketing/Footer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Refund Policy | ${site.name}`,
  description: `Daypass refund policy for ${site.name}.`,
};

export default function RefundPolicyPage() {
  return (
    <main className="bg-cream text-ink">
      <section className="mx-auto grid max-w-4xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Refund Policy</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Refunds and cancellations</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
            This policy explains how Monroes handles Daypass refunds, duplicate purchases, payment failures,
            cancellations, access changes, and promotional entry impacts. It does not limit any rights that may apply
            under Australian Consumer Law.
          </p>
        </div>

        <RefundSection title="Daypass Refund Rules">
          <p>
            Daypass refund requests are reviewed by Monroes support. Refund eligibility may depend on whether the
            Daypass is unused, active, expired, attached to a promotion, or connected to redeemed friend codes.
          </p>
          <p>
            For Daypasses attached to a promotion, refund requests should be made before the related promotional period
            closes, including any published 24-hour countdown extension. After a promotion closes, change-of-mind
            refunds may not be available, except where required by Australian Consumer Law.
          </p>
          <p>
            Any approved refund may revoke member access, access codes, friend codes, and related promotional
            eligibility where allowed by the final rules.
          </p>
        </RefundSection>

        <RefundSection title="Duplicate Purchase and Payment Failure">
          <p>Accidental or duplicate purchases will be reviewed by support.</p>
          <p>
            Payment failures, cancellations, and abandoned checkout sessions do not create active access or promotional
            entries.
          </p>
        </RefundSection>

        <RefundSection title="Promo Entry Impact">
          <p>
            If an entry-linked Daypass is refunded or cancelled before the close of a related promotion, the related
            promotional entry may be cancelled, voided, or marked ineligible.
          </p>
          <p>
            If a friend code has already been redeemed before draw lock, Monroes may need to review the refund and
            promotional entry impact manually.
          </p>
        </RefundSection>

        <RefundSection title="Support Contact">
          <p>Support contact: contact@monroes.au</p>
          <p>
            Include your order ID and checkout email when contacting support. Do not send full membership pass codes or
            access codes in public channels.
          </p>
        </RefundSection>

        <RefundSection title="Related Pages">
          <p>
            See the{" "}
            <Link className="font-black text-orange underline underline-offset-4" href="/privacy">
              privacy notice
            </Link>
            {" "}
            and{" "}
            <Link className="font-black text-orange underline underline-offset-4" href="/terms">
              site terms
            </Link>
            .
          </p>
        </RefundSection>
      </section>
      <Footer />
    </main>
  );
}

function RefundSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="text-2xl font-black leading-tight text-ink">{title}</h2>
      <div className="mt-4 grid gap-4 text-base font-semibold leading-7 text-ink/68">{children}</div>
    </section>
  );
}
