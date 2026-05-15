import { TrackedFAQItem } from "@/components/analytics/TrackedFAQItem";
import { site } from "@/lib/site";

const faqs = [
  {
    question: `What is ${site.name}?`,
    answer: `${site.name} is a private members-only marketplace for OG, rare, vintage, and interesting skateboard decks in Australia.`,
  },
  {
    question: "Is this live yet?",
    answer:
      "The private marketplace is opening gradually. Payments, checkout, and seller tools are not live yet.",
  },
  {
    question: "What is the Preview Daypass?",
    answer:
      "It is the one-day access option for people who want a quick peek at private listings before joining the full membership.",
  },
  {
    question: "What is Monroes Ultra?",
    answer:
      "Monroes Ultra is the monthly membership for ongoing access to private listings, drops, and seller opportunities.",
  },
  {
    question: "Is this Australia only?",
    answer: `Yes. ${site.name} is focused on Australian buyers, sellers, pricing, and shipping expectations.`,
  },
  {
    question: "Can I sell decks later?",
    answer:
      "That is part of the direction. Selected sellers will be introduced gradually as more member places open.",
  },
];

export function FAQ() {
  return (
    <section className="bg-cream py-16 sm:py-20" id="faq">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-orange">FAQ</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">
            The short version before you request access.
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
