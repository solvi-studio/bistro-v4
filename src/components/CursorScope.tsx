"use client";

import CustomCursor from "@/components/customCursor";
import { SmoothScroll } from "@/components/SmoothScroll";

/**
 * Opt-in wrapper for the custom cursor + Lenis smooth scroll.
 * Wrap a page's content in this to enable both on that route only —
 * mounts/unmounts (and the `cursor-none-scope` CSS hook) with the page,
 * so nothing leaks to routes that don't use it.
 */
export function CursorScope({ children }: { children: React.ReactNode }) {
  return (
    <div className="cursor-none-scope">
      <CustomCursor />
      <SmoothScroll>{children}</SmoothScroll>
    </div>
  );
}
