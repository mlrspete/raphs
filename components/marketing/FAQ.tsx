import { TrackedFAQItem } from "@/components/analytics/TrackedFAQItem";
import { site } from "@/lib/site";

const faqs = [
  {
    question: `What is ${site.name}?`,
    answer: `${site.name} is a V0 demand-validation site for a future private marketplace focused on OG, rare, vintage, and interesting skateboard decks.`,
  },
  {
    question: "Is this live yet?",
    answer:
      "This page is testing buyer interest and the paid-access model before marketplace features, payments, inventory, and seller tools are added.",
  },
  {
    question: "What is the 1-Day Preview Pass?",
    answer: `It is a $4.99 AUD access concept for people who want a quick look at the kind of private deck market ${site.name} is shaping.`,
  },
  {
    question: "What is the Monthly Marketplace Pass?",
    answer:
      "It is a $24.99 AUD/month concept for ongoing access to the future curated marketplace experience.",
  },
  {
    question: "Is this Australia only?",
    answer: `Yes. ${site.name} is positioned around Australian buyers, sellers, pricing, and shipping expectations.`,
  },
  {
    question: "Can I sell decks later?",
    answer:
      "That is part of the future marketplace direction. Seller interest will help shape what comes after the buyer-access test.",
  },
];

export function FAQ() {
  return (
    <section className="bg-cream py-16 sm:py-20" id="faq">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-orange">FAQ</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">
            The short version before the proper flows arrive.
          </h2>
        </div>

        <div className="mt-10 divide-y divide-ink/10 rounded-lg border border-ink/10 bg-white shadow-soft">
          {faqs.map((faq) => (
            <TrackedFAQItem
              answer={faq.answer}
              key={faq.question}
              location="homepage_faq"
              properties={{ surface: "homepage" }}
              question={faq.question}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
