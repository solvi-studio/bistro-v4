"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import CreativeHelperSidebar from "./CreativeHelperSidebar";

// Workspace-level Creative Helper. The mind-map page embeds its own combined
// helper (steps + shortlist) inside the canvas split, so hide this one there to
// avoid a duplicate left rail.
export default function WorkspaceHelper() {
  const pathname = usePathname();
  if (pathname.startsWith("/mind-map") || pathname.startsWith("/calendar"))
    return null;
  // CreativeHelperSidebar reads ?script via useSearchParams → Suspense boundary.
  return (
    <Suspense fallback={null}>
      <CreativeHelperSidebar />
    </Suspense>
  );
}
