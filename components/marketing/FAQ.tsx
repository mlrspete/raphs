import { TrackedFAQItem } from "@/components/analytics/TrackedFAQItem";

const faqs = [
  {
    question: "What is Monroes?",
    answer:
      "Monroes is a private member deck market for OG, rare, vintage, and interesting skateboard decks in Australia.",
  },
  {
    question: "Is Monroes live yet?",
    answer:
      "Monroes is currently in an early preview. Access is limited while the platform is shaped around collector demand.",
  },
  {
    question: "What is the Daypass?",
    answer:
      "The Daypass is a one-time way to try Monroes before deciding whether Monroes Ultra is right for you.",
  },
  {
    question: "What is Monroes Ultra?",
    answer:
      "Monroes Ultra is the monthly membership for members who want ongoing access to drops, private member areas, and future opportunities.",
  },
  {
    question: "Is Monroes Australia only?",
    answer:
      "For now, Monroes is focused on Aussie collectors, AUD pricing, and local collector expectations.",
  },
  {
    question: "Can members help shape Monroes?",
    answer:
      "Yes. Member feedback helps guide what Monroes prioritises next, including the types of decks, drops, and collector opportunities surfaced over time.",
  },
];

export function FAQ() {
  return (
    <section className="bg-cream py-16 sm:py-20" id="faq">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-orange">FAQ</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">
            The short version on Monroes.
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
