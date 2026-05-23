"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  itemSelector?: string;
  stagger?: number;
  start?: string;
  y?: number;
};

const defaultItemSelector = "[data-scroll-reveal-item]";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ScrollReveal({
  children,
  className,
  delay = 0,
  duration = 0.78,
  itemSelector,
  stagger = 0,
  start = "top 86%",
  y = 22,
}: ScrollRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;

    if (!root || window.matchMedia(reducedMotionQuery).matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const selector = itemSelector ?? (stagger > 0 ? defaultItemSelector : null);
    const targets = selector ? Array.from(root.querySelectorAll<HTMLElement>(selector)) : [root];
    const animationTargets = targets.length > 0 ? targets : [root];

    const context = gsap.context(() => {
      gsap.set(animationTargets, { autoAlpha: 0, y });
      gsap.to(animationTargets, {
        autoAlpha: 1,
        clearProps: "opacity,visibility,transform",
        delay,
        duration,
        ease: "power3.out",
        stagger: animationTargets.length > 1 ? stagger : 0,
        scrollTrigger: {
          once: true,
          start,
          trigger: root,
        },
        y: 0,
      });
    }, root);

    return () => context.revert();
  }, [delay, duration, itemSelector, stagger, start, y]);

  return (
    <div className={className} ref={rootRef}>
      {children}
    </div>
  );
}
