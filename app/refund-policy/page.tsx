import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Footer } from "@/components/marketing/Footer";
import { campaign001PublicContent } from "@/lib/domain/campaigns/publicContent";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Refund Policy | ${site.name}`,
  description: `Draft Daypass refund policy for ${site.name}.`,
};

export default function RefundPolicyPage() {
  return (
    <main className="bg-cream text-ink">
      <section className="mx-auto grid max-w-4xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Refund Policy</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Daypass refunds and cancellations</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
            This is a draft operational policy for Monroes Daypass purchases. It must be reviewed before launch and does
            not limit rights that may apply under Australian Consumer Law.
          </p>
        </div>

        <RefundSection title="Daypass Refund Rules">
          <p>
            Daypass refund handling must be finalised before launch. Monroes should define whether unused, partially
            used, expired, duplicate, or accidental Daypass purchases are refundable and within what timeframe.
          </p>
          <p>
            Any approved refund may revoke member access, friend codes, and related promotional eligibility where allowed
            by the final rules.
          </p>
        </RefundSection>

        <RefundSection title="Duplicate Purchase and Payment Failure">
          <p>
            Accidental duplicate purchases should be reviewed by support. Payment failures, cancellations, or abandoned
            checkout sessions do not create active Daypass access or promo entries.
          </p>
        </RefundSection>

        <RefundSection title="Promo Entry Impact">
          <p>
            If a Daypass is refunded or cancelled, the related promo entry may be cancelled, voided, or marked ineligible.
            The operator must define the final rule before launch, especially for friend-code redemptions and entries
            that have already changed current holder before draw lock.
          </p>
        </RefundSection>

        <RefundSection title="Support Contact">
          <p>Support contact placeholder: {campaign001PublicContent.supportEmailLabel}.</p>
          <p>
            Include your order short ID and checkout email when contacting support. Do not send full Daypass friend codes
            in public channels.
          </p>
        </RefundSection>

        <RefundSection title="Related Pages">
          <p>
            See the{" "}
            <Link className="font-black text-orange underline underline-offset-4" href={campaign001PublicContent.rulesUrl}>
              Campaign 001 promo rules
            </Link>
            ,{" "}
            <Link className="font-black text-orange underline underline-offset-4" href="/privacy">
              privacy notice
            </Link>
            , and{" "}
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
