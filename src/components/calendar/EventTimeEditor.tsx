"use client";

import { Calendar, Clock } from "lucide-react";
import { useState } from "react";
import type { EnrichedCalendarEvent } from "@/types/plan";
import { durationLabel, fmtDateLong, fmtTime, fromISO } from "./dateUtils";

type TimePatch = Partial<Pick<EnrichedCalendarEvent, "date" | "time" | "endTime">>;

interface Props {
  event: EnrichedCalendarEvent;
  onChange: (patch: TimePatch) => void;
}

export default function EventTimeEditor({ event, onChange }: Props) {
  const [editingTime, setEditingTime] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [startVal, setStartVal] = useState(event.time ?? "");
  const [endVal, setEndVal] = useState(event.endTime ?? "");
  const date = fromISO(event.date);

  function commitTime() {
    onChange({
      time: startVal || undefined,
      endTime: endVal || undefined,
    });
    setEditingTime(false);
  }

  function commitDate(raw: string) {
    if (raw) onChange({ date: raw });
    setEditingDate(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Time row */}
      <div className="flex items-start gap-3 text-sm">
        <Clock size={15} className="shrink-0 text-gray-400 mt-0.5" />
        {editingTime ? (
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={startVal}
                onChange={(e) => setStartVal(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-primary"
                // biome-ignore lint/a11y/noAutofocus: user just clicked edit
                autoFocus
              />
              <span className="text-gray-400 text-xs">→</span>
              <input
                type="time"
                value={endVal}
                onChange={(e) => setEndVal(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={commitTime}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingTime(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setStartVal(event.time ?? "");
              setEndVal(event.endTime ?? "");
              setEditingTime(true);
            }}
            className="text-left text-gray-700 hover:text-primary transition-colors"
          >
            {event.time ? (
              <>
                {fmtTime(event.time)}
                {event.endTime && (
                  <>
                    {" "}
                    <span className="mx-1 text-gray-400">→</span>{" "}
                    {fmtTime(event.endTime)}
                    {"  "}
                    <span className="text-gray-400">
                      {durationLabel(event.time, event.endTime)}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-gray-400">Add time</span>
            )}
          </button>
        )}
      </div>

      {/* Date row */}
      <div className="flex items-center gap-3 text-sm">
        <Calendar size={15} className="shrink-0 text-gray-400" />
        {editingDate ? (
          <div className="flex items-center gap-2">
            <input
              type="date"
              defaultValue={event.date}
              onBlur={(e) => commitDate(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  commitDate((e.target as HTMLInputElement).value);
                if (e.key === "Escape") setEditingDate(false);
              }}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-primary"
              // biome-ignore lint/a11y/noAutofocus: user just clicked edit
              autoFocus
            />
            <button
              type="button"
              onClick={() => setEditingDate(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingDate(true)}
            className="text-left text-gray-700 hover:text-primary transition-colors"
          >
            {fmtDateLong(date)}
          </button>
        )}
      </div>
    </div>
  );
}
