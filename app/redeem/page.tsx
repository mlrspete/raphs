import type { Metadata } from "next";
import Link from "next/link";

import { RedeemDaypassCodeForm } from "@/components/daypass/RedeemDaypassCodeForm";
import { getCurrentMemberProfile } from "@/lib/domain/members/getCurrentMemberProfile";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Redeem Daypass | ${site.name}`,
  description: `Redeem a Monroes Daypass friend code.`,
};

export default async function RedeemPage() {
  const memberProfile = await getCurrentMemberProfile();

  return (
    <main className="min-h-screen bg-cream px-5 py-10 text-ink sm:px-8 lg:px-12">
      <section className="mx-auto grid max-w-3xl gap-6">
        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Daypass code</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-ink">Redeem friend access</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
            Friend Daypass codes unlock a pending 12-hour Daypass. The clock starts later, only when you activate it
            from the member dashboard.
          </p>

          {memberProfile ? (
            <>
              <p className="mt-4 text-sm font-semibold leading-6 text-ink/58">
                Signed in as {memberProfile.email}. Paste the code from your message or email below.
              </p>
              <RedeemDaypassCodeForm />
            </>
          ) : (
            <div className="mt-6 rounded-lg border border-ink/10 bg-cream p-4">
              <p className="text-sm font-semibold leading-6 text-ink/68">
                Sign in or create a member account first. For safety, Monroes will not place a full Daypass code in a
                login link, callback URL, query string, or redirect.
              </p>
              <Link
                className="mt-4 inline-flex rounded-md bg-ink px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
                href="/member/login"
              >
                Log in to redeem
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
