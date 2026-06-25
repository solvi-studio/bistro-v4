"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { CreativeScript } from "@/types/creative";
import { colorForScript } from "@/utils/calendar";

interface Props {
  scripts: CreativeScript[];
  defaultDate: string;
  onClose: () => void;
  onCreate: (
    scriptId: string,
    input: { date: string; title: string; notes: string[] },
  ) => void;
}

// Modal to add an event to one folder (creative script) on a given day.
export default function CreateEventModal({
  scripts,
  defaultDate,
  onClose,
  onCreate,
}: Props) {
  const [scriptId, setScriptId] = useState(scripts[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const canSubmit = scriptId && title.trim() && date;

  function submit() {
    if (!canSubmit) return;
    onCreate(scriptId, {
      date,
      title: title.trim(),
      notes: notes
        .split("\n")
        .map((n) => n.trim())
        .filter(Boolean),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop is a button so close is keyboard-accessible; the card is a
          sibling (not a child), so clicks on it don't reach the backdrop. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">New event</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        {scripts.length === 0 ? (
          <p className="text-sm text-gray-500">
            Create an idea first — events attach to a folder.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
              Folder
              <select
                value={scriptId}
                onChange={(e) => setScriptId(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary"
              >
                {scripts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Film stargazing sequence"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
              Notes (one per line)
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary"
              />
            </label>

            <div className="mt-1 flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${colorForScript(scriptId).dot}`}
              />
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--color-primary-hover) disabled:opacity-50"
              >
                Add event
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
