"use client";

import { useState } from "react";

import { LandingOfferCard } from "@/components/landing/LandingOfferCard";
import { LandingPricingBlock } from "@/components/landing/LandingPricingBlock";
import { daypassCheckoutOptions, defaultDaypassCheckoutQuantity } from "@/lib/domain/daypass/pricing";
import type { LandingPageViewModel } from "@/lib/landing-tests/types";

type LandingDaypassOfferSectionProps = {
  page: LandingPageViewModel;
};

export function LandingDaypassOfferSection({ page }: LandingDaypassOfferSectionProps) {
  const [quantity, setQuantity] = useState(defaultDaypassCheckoutQuantity);

  return (
    <section className="bg-whitecard py-14 sm:py-20" id="daypass-offer">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
        <LandingOfferCard quantity={quantity} />
        <LandingPricingBlock
          checkoutOptions={daypassCheckoutOptions}
          onQuantityChange={setQuantity}
          page={page}
          quantity={quantity}
        />
      </div>
    </section>
  );
}
