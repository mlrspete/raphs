import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const steps = [
  {
    title: "Select membership",
    body: "Start with a Daypass or go straight to Monroes Ultra.",
  },
  {
    title: "Unlock access",
    body: "Browse members-only listings.",
  },
  {
    title: "Secure what you want",
    body: "Shortlist favourites and move early when the right deck appears.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <ScrollReveal className="grid gap-5 lg:grid-cols-[0.72fr_1fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase text-orange">How it works</p>
          </div>
        </ScrollReveal>

        <ScrollReveal className="mt-10 grid gap-4 md:grid-cols-3" stagger={0.08}>
          {steps.map((step, index) => (
            <article
              className="relative overflow-hidden rounded-lg border border-ink/10 bg-cream p-6 shadow-soft sm:p-7"
              data-scroll-reveal-item
              key={step.title}
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange via-peach to-mint" />
              <div className="absolute -right-12 -top-12 h-28 w-40 rotate-6 rounded-lg bg-orange/10 blur-2xl" />
              <div className="relative">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-ink text-sm font-black text-white shadow-soft">
                  0{index + 1}
                </span>
                <h3 className="mt-7 text-2xl font-black uppercase leading-tight text-ink">{step.title}</h3>
                <p className="mt-4 text-base font-semibold leading-7 text-ink/68">{step.body}</p>
              </div>
            </article>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
