"use client";

import { motion } from "motion/react";
import { PnrInputPanel } from "@/components/pnr/pnr-input-panel";
import { fadeTransition, springUI, usePrefersReducedMotion } from "@/lib/motion";

export function EmptyState() {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="relative flex min-h-[calc(100vh-4.5rem)] flex-col items-center justify-center px-4 pb-16 pt-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[18%] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-[10%] right-[8%] h-48 w-48 rounded-full bg-slate-400/10 blur-2xl" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-lg text-center"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? fadeTransition : springUI}
      >
        <p className="font-display text-3xl font-semibold tracking-tight text-ink display-tight md:text-5xl">
          Train Coach Planner
        </p>
        <p className="mt-4 text-base text-slate-600 md:text-lg">
          Combine multiple PNRs into one visual coach map.
        </p>

        <div className="mt-10 text-left">
          <PnrInputPanel />
        </div>
      </motion.div>
    </div>
  );
}
