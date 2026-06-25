"use client";

import { ChevronsRight } from "lucide-react";
import { useState } from "react";
import type { EnrichedCalendarEvent } from "@/types/plan";
import EventLocationEditor from "./EventLocationEditor";
import EventNotesEditor from "./EventNotesEditor";
import EventReminders from "./EventReminders";
import EventTimeEditor from "./EventTimeEditor";

const PHASE_LABEL: Record<string, string> = {
  pre: "Pre-Production",
  production: "Production Day",
  post: "Post-Production",
};

interface Props {
  event: EnrichedCalendarEvent;
  onClose: () => void;
  onUpdate: (updated: EnrichedCalendarEvent) => void;
}

export default function EventDetailPanel({ event, onClose, onUpdate }: Props) {
  // Local draft — kept in sync via key remount (CalendarPageClient passes key={event.id})
  const [draft, setDraft] = useState<EnrichedCalendarEvent>(event);

  function patch(updates: Partial<EnrichedCalendarEvent>) {
    const updated = { ...draft, ...updates };
    setDraft(updated);
    onUpdate(updated);
  }

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
          <span className="text-amber-500">[{draft.scriptTitle}]</span>{" "}
          {draft.title}
        </p>
      </div>

      {draft.phase && (
        <span className="mb-3 inline-block text-[11px] font-medium text-gray-400">
          {PHASE_LABEL[draft.phase]}
        </span>
      )}

      <div className="mb-4 border-t border-gray-100" />

      {/* Time + Date */}
      <div className="mb-4">
        <EventTimeEditor
          event={draft}
          onChange={(p) => patch(p)}
        />
      </div>

      {/* Location */}
      <div className="mb-4">
        <EventLocationEditor
          location={draft.location}
          onChange={(location) => patch({ location })}
        />
      </div>

      <div className="mb-4 border-t border-dashed border-gray-200" />

      {/* Notes */}
      <div className="mb-5">
        <EventNotesEditor
          notes={draft.notes}
          onChange={(notes) => patch({ notes })}
        />
      </div>

      {/* Reminders */}
      <EventReminders
        reminders={draft.reminders ?? []}
        onChange={(reminders) => patch({ reminders })}
      />
    </aside>
  );
}
