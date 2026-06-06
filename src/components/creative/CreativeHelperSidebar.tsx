"use client";

import { ChevronsLeft, ChevronsRight, RotateCcw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import CreativeFlowReminder from "./CreativeFlowReminder";
import CreativePillList from "./CreativePillList";

// Maps a route to the pill it should highlight in link mode.
const ROUTE_PILL: Record<string, number> = {
  "/mind-map": 0,
  "/summarise": 1,
  "/plan": 2,
};

interface Props {
  /** Active pill index — overrides route-based highlight (tab mode). */
  active?: number;
  /** When provided, pills act as tabs. Otherwise they link to their routes. */
  onSelect?: (index: number) => void;
  /** Show the "Your Creative Flow Reminder" card below the pills. */
  showReminder?: boolean;
}

export default function CreativeHelperSidebar({
  active,
  onSelect,
  showReminder = true,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Link mode: highlight the pill matching the current route.
  const activeIndex = onSelect ? active : (active ?? ROUTE_PILL[pathname]);

  function rewatch() {
    router.push("/creative/guide?rewatch=1");
  }

  if (collapsed) {
    return (
      <aside className="flex h-full w-36 shrink-0 flex-col items-center gap-3 border-r border-gray-100 bg-white py-4">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Expand Creative Helper"
          className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100"
        >
          <ChevronsRight size={18} />
        </button>
        <CreativePillList active={activeIndex} onSelect={onSelect} iconOnly />
        <button
          type="button"
          onClick={rewatch}
          aria-label="Rewatch guide"
          className="mt-auto grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <RotateCcw size={15} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[30vw] shrink-0 flex-col gap-6 overflow-y-auto border-r border-gray-100 bg-white p-6 font-[var(--font-poppins)]">
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-lg font-bold text-gray-800">
          Your Creative Helper
        </h2>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse Creative Helper"
          className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100"
        >
          <ChevronsLeft size={18} />
        </button>
      </div>

      <div className="mt-[15vh]">
        <CreativePillList active={activeIndex} onSelect={onSelect} />
      </div>



      {showReminder && <CreativeFlowReminder />}

      <button
        type="button"
        onClick={rewatch}
        className="mt-auto flex items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      >
        <RotateCcw size={15} />
        Rewatch guide
      </button>
    </aside>
  );
}
