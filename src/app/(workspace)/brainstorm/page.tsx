import type { Metadata } from "next";
import { Suspense } from "react";
import MindMapCanvas from "@/components/mind-map/canvas/MindMapCanvas";

export const metadata: Metadata = { title: "Brainstorm" };

export default function MindMapPage() {
  return (
    <Suspense fallback={null}>
      <MindMapCanvas />
    </Suspense>
  );
}
