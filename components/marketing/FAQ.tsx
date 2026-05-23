import { TrackedFAQItem } from "@/components/analytics/TrackedFAQItem";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const faqs = [
  {
    question: "What is Monroes?",
    answer:
      "Monroes is a subscription-based members-only marketplace for OG, rare, vintage and interesting complete skateboards and skateboard decks in Australia.",
  },
  {
    question: "What is the Daypass?",
    answer:
      "The Daypass is a one-time way to try Monroes before deciding whether Monroes Ultra is right for you. It is a one-time purchase with no recurring charges or hidden fees, and it grants 12-hour access after redemption.",
  },
  {
    question: "What is Monroes Ultra?",
    answer: "Monroes Ultra is the monthly membership for members who want ongoing access to Monroes.",
  },
  {
    question: "Is Monroes Australia only?",
    answer: "Monroes is based in Melbourne and exclusively focused on Aussie collectors and local collector expectations.",
  },
  {
    question: "Can members help shape Monroes?",
    answer:
      "Yes. Member feedback helps guide what Monroes prioritises next, including new types of items, drops, and collector opportunities surfaced over time.",
  },
  {
    question: "How many Daypasses can I purchase?",
    answer:
      "You can only have one Daypass active at a time, however you can purchase multiple Daypasses at a time and have those Daypasses available for later activation.",
  },
];

export function FAQ() {
  return (
    <section className="bg-cream py-16 sm:py-20" id="faq">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
        <ScrollReveal className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-orange">FAQ</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">
            The short version on Monroes.
          </h2>
        </ScrollReveal>

        <ScrollReveal className="mt-10 divide-y divide-ink/10 rounded-lg border border-ink/10 bg-white shadow-soft">
          {faqs.map((faq) => (
            <TrackedFAQItem
              answer={faq.answer}
              key={faq.question}
              location="homepage_faq"
              properties={{ surface: "homepage" }}
              question={faq.question}
            />
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
