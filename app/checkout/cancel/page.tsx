import type { Metadata } from "next";
import Link from "next/link";

import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Checkout Cancelled | ${site.name}`,
  description: `Payment cancelled for ${site.name}.`,
};

export default function CheckoutCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-10 text-ink sm:px-8 lg:px-12">
      <section className="w-full max-w-2xl rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Payment cancelled</p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink">No payment was completed</h1>
        <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
          You can return to Monroes whenever you are ready.
        </p>
        <Link
          className="mt-6 inline-flex rounded-md bg-ink px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
          href="/"
        >
          Return to Monroes
        </Link>
      </section>
    </main>
  );
}
