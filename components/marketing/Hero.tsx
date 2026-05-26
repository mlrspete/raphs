import Image from "next/image";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import monroesHeroImage from "@/content/monroes_hero_v1.2.webp";

export function Hero() {
  return (
    <section className="relative min-h-[88svh] overflow-hidden border-b border-ink/10 bg-[#fffaf1]">
      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-orange via-peach to-mint" />

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
