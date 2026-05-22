import { Suspense } from "react";
import MindMapCanvas from "@/components/mind-map/canvas/MindMapCanvas";

export default function MindMapPage() {
  return (
    <Suspense fallback={null}>
      <MindMapCanvas />
    </Suspense>
  );
}
