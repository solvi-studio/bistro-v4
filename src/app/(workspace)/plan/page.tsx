import type { Metadata } from "next";
import { Suspense } from "react";
import PlanPageClient from "@/components/plan/PlanPageClient";

export const metadata: Metadata = { title: "Plan" };

export default function PlanPage() {
  // PlanPageClient reads ?script via useSearchParams → needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <PlanPageClient />
    </Suspense>
  );
}
