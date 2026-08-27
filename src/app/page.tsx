"use client";

import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { useTripStore } from "@/store/trip-store";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { TripListPanel } from "@/components/trip/trip-list-panel";
import { CreateTripPanel } from "@/components/trip/create-trip-panel";
import { ExportPanel } from "@/components/export/export-panel";
import { fadeTransition, usePrefersReducedMotion } from "@/lib/motion";

const TripWorkspace = dynamic(
  () =>
    import("@/components/trip/trip-workspace").then((mod) => mod.TripWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center animate-in fade-in duration-300">
        <div className="material rounded-2xl px-5 py-3 text-sm text-muted">
          Loading trip workspace…
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  const appStep = useTripStore((s) => s.appStep);
  const trip = useTripStore((s) => s.trip);
  const reduced = usePrefersReducedMotion();

  const step =
    !trip && (appStep === "layout" || appStep === "export")
      ? "trips"
      : appStep;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-10 pt-4 md:px-6 md:pt-6">
      <motion.div
        key={step}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reduced ? fadeTransition : { duration: 0.28, ease: "easeOut" }
        }
      >
        {step === "dashboard" && <DashboardPanel />}
        {step === "trips" && <TripListPanel />}
        {step === "create" && <CreateTripPanel />}
        {step === "layout" && trip && <TripWorkspace />}
        {step === "export" && <ExportPanel />}
      </motion.div>
    </main>
  );
}
