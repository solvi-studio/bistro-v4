"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import ResizableSplit from "@/components/mind-map/canvas/ResizableSplit";
import CreativeHelperSidebar from "./CreativeHelperSidebar";

// Workspace content shell. Mind-map and calendar render their own layout (own
// helper / sidebar), so they get the page full-width. Every other workspace page
// (summarise, plan) gets the Creative Helper in a resizable split — same drag /
// collapse behaviour as the mind-map bar.
export default function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/mind-map") || pathname.startsWith("/calendar")) {
    return <main className="min-w-0 flex-1 overflow-hidden">{children}</main>;
  }

  return (
    <div className="min-w-0 flex-1">
      <ResizableSplit
        left={
          <Suspense fallback={null}>
            <CreativeHelperSidebar embedded />
          </Suspense>
        }
        right={<main className="h-full overflow-hidden">{children}</main>}
      />
    </div>
  );
}
