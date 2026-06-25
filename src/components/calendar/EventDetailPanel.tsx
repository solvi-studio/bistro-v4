"use client";

import { Bell, Calendar, Clock, ChevronsRight, MapPin, X } from "lucide-react";
import type { EnrichedCalendarEvent } from "@/types/plan";
import { durationLabel, fmtDateLong, fmtTime, fromISO } from "./dateUtils";

const PHASE_LABEL: Record<string, string> = {
  pre: "Pre-Production",
  production: "Production Day",
  post: "Post-Production",
};

const DEFAULT_REMINDERS = ["1 hour before", "1 day before"];

interface Props {
  event: EnrichedCalendarEvent;
  onClose: () => void;
}

export default function EventDetailPanel({ event, onClose }: Props) {
  const date = fromISO(event.date);

  return (
    <aside className="flex w-85 shrink-0 flex-col border-l border-gray-100 bg-white p-5 overflow-y-auto font-(--font-poppins)">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-500">Event</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 hover:bg-gray-100"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      {/* Title */}
      <div className="mb-1">
        <p className="text-base font-semibold leading-snug text-gray-900">
          <span className="text-amber-500">[{event.scriptTitle}]</span>{" "}
          {event.title}
        </p>
      </div>

      {event.phase && (
        <span className="mb-3 inline-block text-[11px] font-medium text-gray-400">
          {PHASE_LABEL[event.phase]}
        </span>
      )}

      <div className="mb-4 border-t border-gray-100" />

      {/* Details */}
      <div className="mb-4 flex flex-col gap-3">
        {event.time && (
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <Clock size={15} className="shrink-0 text-gray-400" />
            <span>
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
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 text-sm text-gray-700">
          <Calendar size={15} className="shrink-0 text-gray-400" />
          <span>{fmtDateLong(date)}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-400">
          <MapPin size={15} className="shrink-0" />
          <span>Add location</span>
        </div>
      </div>

      <div className="mb-4 border-t border-dashed border-gray-200" />

      {/* Notes */}
      <div className="mb-5">
        <div className="min-h-30 rounded-lg border border-dashed border-gray-300 p-3">
          {event.notes.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {event.notes.map((n, i) => (
                <li key={i} className="text-sm text-gray-700">
                  {n}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-sm text-gray-400">Add Notes</span>
          )}
        </div>
      </div>

      {/* Reminders */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Bell size={15} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Reminders</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {DEFAULT_REMINDERS.map((label) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-700"
            >
              <span>{label}</span>
              <button
                type="button"
                aria-label={`Remove ${label}`}
                className="text-red-400 hover:text-red-600"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
