"use client";

import { ChevronsLeft, Plus } from "lucide-react";
import type { PlanPhase } from "@/types/plan";
import MiniMonth from "./MiniMonth";

const PHASES: { phase: PlanPhase; label: string; chip: string }[] = [
  {
    phase: "pre",
    label: "Pre-Production",
    chip: "bg-[#FF9699] text-gray-900 border border-[#FF9699]",
  },
  {
    phase: "production",
    label: "Production Day",
    chip: "bg-[#73B7FF] text-gray-900 border border-[#73B7FF]",
  },
  {
    phase: "post",
    label: "Post-Production",
    chip: "bg-[#FBBF24] text-gray-900 border border-[#FBBF24]",
  },
];

interface Props {
  activePhases: Set<PlanPhase>;
  onTogglePhase: (p: PlanPhase) => void;
  selectedISO: string;
  onSelectDate: (iso: string) => void;
  onCreate: () => void;
  onCollapse: () => void;
}

export default function CalendarSidebar({
  activePhases,
  onTogglePhase,
  selectedISO,
  onSelectDate,
  onCreate,
  onCollapse,
}: Props) {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-5 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--color-primary-hover)"
        >
          Create <Plus size={15} />
        </button>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Collapse sidebar"
          className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100"
        >
          <ChevronsLeft size={16} />
        </button>
      </div>

      <MiniMonth selectedISO={selectedISO} onSelect={onSelectDate} />

      <div>
        <h3 className="mb-2 text-xs font-semibold text-gray-500">Filter</h3>
        <div className="flex flex-col gap-2">
          {PHASES.map(({ phase, label, chip }) => {
            const active = activePhases.has(phase);
            return (
              <button
                key={phase}
                type="button"
                onClick={() => onTogglePhase(phase)}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-opacity ${chip} ${
                  active ? "" : "opacity-40"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
