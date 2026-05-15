"use client";

import type { PlanTask } from "@/types/plan";
import { CalendarIcon } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  task: PlanTask;
  onUpdate: (updated: PlanTask) => void;
}

const COLOR_MAP: Record<PlanTask["colorTag"], string> = {
  pink: "bg-[var(--color-soft-pink)] text-rose-700",
  blue: "bg-[var(--color-soft-blue)] text-blue-700",
  yellow: "bg-[var(--color-soft-yellow)] text-amber-700",
  default: "bg-gray-100 text-gray-700",
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export default function TaskItem({ task, onUpdate }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleCalendarClick() {
    setShowPicker((v) => !v);
    setTimeout(() => inputRef.current?.showPicker?.(), 50);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    onUpdate({ ...task, scheduledDate: e.target.value });
    setShowPicker(false);
  }

  return (
    <div className="flex items-center gap-2 py-1.5">
      <div
        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium ${COLOR_MAP[task.colorTag]}`}
      >
        {task.text}
      </div>

      <div className="relative shrink-0">
        {task.scheduledDate ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
              {formatDate(task.scheduledDate)}
            </span>
            <button
              type="button"
              onClick={handleCalendarClick}
              aria-label="Change date"
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <CalendarIcon size={16} className="text-gray-400" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCalendarClick}
            aria-label="Add date"
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <CalendarIcon size={16} className="text-gray-400" />
          </button>
        )}

        {showPicker && (
          <div className="absolute right-0 top-9 z-20 bg-white rounded-2xl shadow-lg border border-gray-100 p-3">
            <p className="text-xs text-gray-400 mb-2">Which day to add?</p>
            <input
              ref={inputRef}
              type="date"
              defaultValue={task.scheduledDate ?? ""}
              onChange={handleDateChange}
              className="text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
