import Link from "next/link";

import { site } from "@/lib/site";

export default function LandingPageNotFound() {
  return (
    <main className="min-h-screen bg-cream px-5 py-16 text-ink sm:px-8 lg:px-12">
      <section className="mx-auto flex min-h-[70svh] max-w-3xl flex-col justify-center">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Landing page unavailable</p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-ink sm:text-5xl">
          This {site.name} landing page is not live.
        </h1>
        <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-ink/68 sm:text-lg">
          The page may be missing, paused, or still being prepared. Landing pages only render when their status is live.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-6 py-3 text-center text-sm font-black uppercase tracking-[0.12em] text-white shadow-soft transition hover:bg-ink/88 focus:outline-none focus:ring-4 focus:ring-orange/25 sm:w-auto"
            href="/"
          >
            Back to homepage
          </Link>
          <Link
            className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-ink/10 bg-white px-6 py-3 text-center text-sm font-black uppercase tracking-[0.12em] text-ink transition hover:bg-peach focus:outline-none focus:ring-4 focus:ring-orange/25 sm:w-auto"
            href="/privacy"
          >
            Privacy notice
          </Link>
        </div>
      </section>
    </main>
  );
}
