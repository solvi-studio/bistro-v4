import { Suspense } from "react";
import CreativeGuideClient from "@/components/creative/CreativeGuideClient";

export default function CreativeGuidePage() {
  return (
    <Suspense fallback={null}>
      <CreativeGuideClient />
    </Suspense>
  );
}
