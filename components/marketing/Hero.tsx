import Image from "next/image";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import monroesHeroImage from "@/content/monroes_hero_v1.1.webp";

export function Hero() {
  return (
    <section className="relative min-h-[88svh] overflow-hidden border-b border-ink/10 bg-cream">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,252,245,0.98)_0%,rgba(255,240,225,0.94)_48%,rgba(255,138,61,0.52)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_30%,rgba(255,138,61,0.34),transparent_30%),radial-gradient(circle_at_18%_72%,rgba(125,222,203,0.22),transparent_26%)]" />
      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-orange via-peach to-mint" />

      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-24 top-20 h-[34rem] w-[42rem] opacity-60"
          style={{
            backgroundImage:
              "repeating-radial-gradient(ellipse at 28% 42%, rgba(34,34,34,0.14) 0 1px, transparent 1px 24px), repeating-radial-gradient(ellipse at 62% 46%, rgba(255,138,61,0.18) 0 1px, transparent 1px 34px)",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[88svh] max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <div className="flex flex-1 items-center py-14 sm:py-16 lg:py-10">
          <ScrollReveal className="relative z-10 flex w-full max-w-[78rem] flex-col items-start" y={18}>
            <h1 className="sr-only">Monroes members-only skateboard marketplace</h1>
            <div
              className="relative -ml-24 h-[17rem] w-[calc(100vw+6rem)] max-w-none overflow-hidden sm:-ml-32 sm:h-[27rem] lg:-ml-[18rem] lg:h-[37rem] xl:-ml-[21rem] xl:h-[42rem]"
            >
              <Image
                alt="Australia's most wanted skateboards - Monroes"
                className="object-contain object-left"
                fill
                priority
                sizes="100vw"
                src={monroesHeroImage}
              />
            </div>
            <p className="mt-6 max-w-xl text-pretty text-lg font-semibold leading-8 text-ink/72 sm:text-xl">
              Monroes is a private members-only marketplace for OG, rare and interesting skateboard decks in Australia.
            </p>
            <a
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-7 py-3 text-center text-sm font-black uppercase text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-orange focus:outline-none focus:ring-4 focus:ring-orange/35 sm:w-auto"
              href="#access"
            >
              SIGN UP
            </a>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
