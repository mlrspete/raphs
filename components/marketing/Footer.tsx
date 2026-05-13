import { site } from "@/lib/site";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
        <div>
          <p className="text-lg font-black text-ink">{site.name}</p>
          <p className="mt-1 text-sm font-semibold text-ink/60">
            Private deck access concept for {site.market}. Pricing shown in {site.currency}.
          </p>
        </div>
        <div className="flex gap-3">
          <Link className="text-sm font-black uppercase tracking-[0.12em] text-ink/65 hover:text-ink" href="/#access">
            Access
          </Link>
          <Link className="text-sm font-black uppercase tracking-[0.12em] text-ink/65 hover:text-ink" href="/#faq">
            FAQ
          </Link>
          <Link className="text-sm font-black uppercase tracking-[0.12em] text-ink/65 hover:text-ink" href="/privacy">
            Privacy
          </Link>
          <Link className="text-sm font-black uppercase tracking-[0.12em] text-ink/65 hover:text-ink" href="/terms">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
