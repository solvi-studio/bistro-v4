"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { CreativeScript } from "@/types/creative";
import { colorForScript } from "@/utils/calendar";
import { PRESETS as REMINDER_PRESETS } from "./EventReminders";

interface Props {
  scripts: CreativeScript[];
  defaultDate: string;
  onClose: () => void;
  onCreate: (
    scriptId: string,
    input: {
      date: string;
      title: string;
      notes: string[];
      time?: string;
      endTime?: string;
      location?: string;
      reminders?: string[];
    },
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
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [reminders, setReminders] = useState<string[]>([]);

  const canSubmit = scriptId && title.trim() && date;

  function toggleReminder(label: string) {
    setReminders((prev) =>
      prev.includes(label) ? prev.filter((r) => r !== label) : [...prev, label],
    );
  }

  function submit() {
    if (!canSubmit) return;
    onCreate(scriptId, {
      date,
      title: title.trim(),
      notes: notes
        .split("\n")
        .map((n) => n.trim())
        .filter(Boolean),
      time: startTime || undefined,
      endTime: endTime || undefined,
      location: location.trim() || undefined,
      reminders: reminders.length > 0 ? reminders : undefined,
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

            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs font-semibold text-gray-600">
                Start time
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs font-semibold text-gray-600">
                End time
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary"
                />
              </label>
            </div>

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
              Location
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Riverside park"
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

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-600">
                Reminders
              </span>
              <div className="flex flex-wrap gap-1.5">
                {REMINDER_PRESETS.map((label) => {
                  const active = reminders.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleReminder(label)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

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
