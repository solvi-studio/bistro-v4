import type { Metadata } from "next";
import { Suspense } from "react";
import CreativeGuideClient from "@/components/creative/CreativeGuideClient";

export const metadata: Metadata = { title: "Guide" };

export default function CreativeGuidePage() {
  return (
    <Suspense fallback={null}>
      <CreativeGuideClient />
    </Suspense>
  );
}
