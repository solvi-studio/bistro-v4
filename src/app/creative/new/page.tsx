import { Suspense } from "react";
import CreativeComposeClient from "@/components/creative/CreativeComposeClient";

export default function CreativeNewPage() {
  return (
    <Suspense fallback={null}>
      <CreativeComposeClient />
    </Suspense>
  );
}
