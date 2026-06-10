import { Suspense } from "react";
import PlanPageClient from "@/components/plan/PlanPageClient";

export default function PlanPage() {
  // PlanPageClient reads ?script via useSearchParams → needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <PlanPageClient />
    </Suspense>
  );
}
