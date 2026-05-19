import type { Metadata } from "next";
import Link from "next/link";

import { campaign001Route } from "@/lib/domain/campaigns/config";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Checkout Cancelled | ${site.name}`,
  description: `Return to Campaign 001 checkout for ${site.name}.`,
};

export default function CheckoutCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-10 text-ink sm:px-8 lg:px-12">
      <section className="w-full max-w-2xl rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Checkout cancelled</p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink">No payment was completed</h1>
        <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
          You can return to Campaign 001 whenever you are ready to choose a Daypass quantity and restart Stripe Checkout.
        </p>
        <Link
          className="mt-6 inline-flex rounded-md bg-ink px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
          href={campaign001Route}
        >
          Return to Campaign 001
        </Link>
      </section>
    </main>
  );
}
