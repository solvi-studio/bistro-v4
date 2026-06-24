"use client";

import { Calendar, Plus } from "lucide-react";
import type { CreativeScript } from "@/types/creative";
import { colorForScript } from "@/utils/calendar";
import MiniMonth from "./MiniMonth";

interface Props {
  scripts: CreativeScript[];
  activeScriptIds: Set<string>;
  onToggleScript: (id: string) => void;
  selectedISO: string;
  onSelectDate: (iso: string) => void;
  onCreate: () => void;
}

export default function CalendarSidebar({
  scripts,
  activeScriptIds,
  onToggleScript,
  selectedISO,
  onSelectDate,
  onCreate,
}: Props) {
  return (
    <aside className="flex w-[240px] shrink-0 flex-col gap-5 overflow-y-auto p-4">
      <button
        type="button"
        onClick={onCreate}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
      >
        Create <Plus size={15} />
      </button>

      <MiniMonth selectedISO={selectedISO} onSelect={onSelectDate} />

      <div>
        <h3 className="mb-2 text-xs font-semibold text-gray-500">
          Calendar Sync
        </h3>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 opacity-70"
        >
          <Calendar size={13} />
          Google Calendar
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold text-gray-500">Filter</h3>
        <div className="flex flex-col gap-2">
          {scripts.map((s) => {
            const active = activeScriptIds.has(s.id);
            const c = colorForScript(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onToggleScript(s.id)}
                className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition-opacity ${c.chip} ${
                  active ? "" : "opacity-40"
                }`}
              >
                {s.title}
              </button>
            );
          })}
          {scripts.length === 0 && (
            <p className="text-xs text-gray-400">No folders yet.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
