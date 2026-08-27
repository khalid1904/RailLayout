"use client";

import { useEffect, useState } from "react";

/** Critically damped UI spring — no overshoot. */
export const springUI = {
  type: "spring" as const,
  bounce: 0,
  duration: 0.35,
};

/** Slight bounce for momentum / flick releases only. */
export const springMomentum = {
  type: "spring" as const,
  bounce: 0.18,
  duration: 0.4,
};

export const fadeTransition = {
  duration: 0.2,
  ease: "easeOut" as const,
};

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}
