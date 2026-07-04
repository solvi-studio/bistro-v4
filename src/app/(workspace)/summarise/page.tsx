import type { Metadata } from "next";
import { Suspense } from "react";
import SummarisePageClient from "@/components/summarise/SummarisePageClient";

export const metadata: Metadata = { title: "Summarise" };

export default function SummarisePage() {
  // SummarisePageClient reads ?script via useSearchParams → Suspense boundary.
  return (
    <Suspense fallback={null}>
      <SummarisePageClient />
    </Suspense>
  );
}
