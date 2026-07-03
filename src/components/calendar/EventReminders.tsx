"use client";

import { Bell, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const PRESETS = [
  "15 min before",
  "30 min before",
  "1 hour before",
  "1 day before",
];

interface Props {
  reminders: string[];
  onChange: (reminders: string[]) => void;
}

export default function EventReminders({ reminders, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close preset dropdown on outside click
  useEffect(() => {
    if (!adding) return;
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setAdding(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [adding]);

  function add(label: string) {
    if (!reminders.includes(label)) onChange([...reminders, label]);
    setAdding(false);
  }

  function remove(i: number) {
    onChange(reminders.filter((_, idx) => idx !== i));
  }

  const available = PRESETS.filter((p) => !reminders.includes(p));

  return (
    <div>
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Reminders</span>
        </div>
        {available.length > 0 && (
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              aria-label="Add reminder"
              className="flex h-5 w-5 items-center justify-center rounded-md text-gray-400 hover:text-primary transition-colors"
            >
              <Plus size={13} />
            </button>
            {adding && (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                {available.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => add(opt)}
                    className="block w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reminder list */}
      <div className="flex flex-col gap-1.5">
        {reminders.length === 0 && (
          <p className="text-xs text-gray-400">No reminders set</p>
        )}
        {reminders.map((label, i) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-700"
          >
            <span>{label}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove ${label}`}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
