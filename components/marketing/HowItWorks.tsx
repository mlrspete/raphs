import { site } from "@/lib/site";

const steps = [
  {
    title: "Arrive from an invite or ad",
    body: `${site.name} is positioned for Australia-only traffic that already cares about decks with a bit of history.`,
  },
  {
    title: "Choose a paid-access path",
    body: "Preview access tests short-term intent. Monthly access tests whether buyers see ongoing value in a private market.",
  },
  {
    title: "Shape the first market",
    body: "Early interest helps decide what categories, sellers, and buying signals should matter before the real marketplace exists.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-orange">How it works</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-5xl">
            A simple path from curiosity to access intent.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article className="rounded-lg border border-ink/10 bg-cream p-6" key={step.title}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-orange text-sm font-black text-white">
                {index + 1}
              </span>
              <h3 className="mt-6 text-xl font-black leading-tight text-ink">{step.title}</h3>
              <p className="mt-4 text-base font-medium leading-7 text-ink/70">{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
