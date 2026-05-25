import type { Metadata } from "next";

import { MemberAuthForm } from "@/components/member/MemberAuthForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Member Login | ${site.name}`,
  description: `Member login for ${site.name}.`,
};

export default function MemberLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-12 text-ink">
      <section className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Member access</p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink">Sign in to Monroes</h1>
        <p className="mt-4 text-base font-semibold leading-7 text-ink/68">
          Use the same email you used at checkout.
        </p>
        <MemberAuthForm />
      </section>
    </main>
  );
}
