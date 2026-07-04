"use client";

import { useEffect, useRef, useState } from "react";
import type { CalendarEvent, PlanTask } from "@/types/plan";

interface Props {
  event: CalendarEvent | null;
  tasks: PlanTask[];
  date: string | null;
  onUpdateTaskText?: (taskId: string, text: string) => void;
}

// ── Phase pill config ─────────────────────────────────────────────────────────

const PHASE_CONFIG: Record<
  PlanTask["phase"],
  { label: string; pillCls: string; textCls: string }
> = {
  pre: {
    label: "Pre-Production",
    pillCls: "bg-rose-200 text-rose-600",
    textCls: "text-rose-500",
  },
  production: {
    label: "Production Day",
    pillCls: "bg-blue-500 text-white",
    textCls: "text-blue-500",
  },
  post: {
    label: "Post-Production",
    pillCls: "bg-amber-200 text-amber-700",
    textCls: "text-amber-600",
  },
};

// ── Timeline entry ────────────────────────────────────────────────────────────

interface Entry {
  time: string | null; // "HH:MM" start, or null
  endTime?: string | null; // "HH:MM" end, optional
  pillLabel: string;
  pillCls: string;
  textCls: string;
  text: string;
  strikethrough?: boolean;
  taskId?: string;
}

function formatTime(raw: string): string {
  const [hStr, mStr] = raw.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour} ${period}` : `${hour}:${mStr} ${period}`;
}

// Sort key: null (no time) → "00:00" so timeless entries appear first.
function sortKey(t: string | null) {
  return t ?? "00:00";
}

// Auto-grow the task-name textarea up to 5 lines, then scroll internally.
const TASK_NAME_MAX_LINES = 5;
function resizeTaskNameTextarea(el: HTMLTextAreaElement) {
  const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight);
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, lineHeight * TASK_NAME_MAX_LINES)}px`;
}

interface EditableTaskTextProps {
  text: string;
  textCls: string;
  strikethrough?: boolean;
  onCommit: (text: string) => void;
}

function EditableTaskText({
  text,
  textCls,
  strikethrough,
  onCommit,
}: EditableTaskTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      resizeTaskNameTextarea(textareaRef.current);
    }
  }, [isEditing]);

  function startEditing() {
    setDraft(text);
    setIsEditing(true);
  }

  function commit() {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== text) onCommit(trimmed);
  }

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={draft}
        rows={1}
        onChange={(e) => {
          setDraft(e.target.value);
          resizeTaskNameTextarea(e.target);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") setIsEditing(false);
        }}
        className={`flex-1 min-w-40 resize-none overflow-y-auto rounded-lg border border-primary/40 px-3 py-2 text-sm font-normal leading-snug outline-none focus:border-primary ${textCls}`}
      />
    );
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: double-click to edit
    <span
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
      className={`text-sm font-normal cursor-text whitespace-pre-wrap break-words ${textCls} ${
        strikethrough ? "line-through opacity-60" : ""
      }`}
    >
      {text}
    </span>
  );
}

export default function DayScheduleCard({
  event,
  tasks,
  date,
  onUpdateTaskText,
}: Props) {
  if (!date) {
    return (
      <div className="flex-1 min-h-40 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-sm text-gray-400">
        Select a day to see details
      </div>
    );
  }

  const [, , dayStr] = date.split("-");
  const day = parseInt(dayStr, 10);

  // Build entries from tasks then events.
  const entries: Entry[] = [
    ...tasks.map((t): Entry => {
      const cfg = PHASE_CONFIG[t.phase];
      return {
        time: t.scheduledStartTime ?? null,
        endTime: t.scheduledEndTime ?? null,
        pillLabel: cfg.label,
        pillCls: cfg.pillCls,
        textCls: cfg.textCls,
        text: t.text,
        strikethrough: t.completed,
        taskId: t.id,
      };
    }),
    ...(event?.notes
      ? [
          {
            time: event.time ?? null,
            pillLabel: event.title,
            pillCls: "bg-gray-200 text-gray-700",
            textCls: "text-gray-600",
            text: event.notes,
          } satisfies Entry,
        ]
      : []),
  ].sort((a, b) => sortKey(a.time).localeCompare(sortKey(b.time)));

  const hasContent = entries.length > 0;

  // Group consecutive entries under the same time header.
  const groups: {
    time: string | null;
    endTime?: string | null;
    entries: Entry[];
  }[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.time === entry.time && last.endTime === entry.endTime) {
      last.entries.push(entry);
    } else {
      groups.push({
        time: entry.time,
        endTime: entry.endTime,
        entries: [entry],
      });
    }
  }

  return (
    <div className="flex-1 min-h-80  max-h-[40vh] rounded-2xl bg-white border border-gray-100 p-8 flex gap-8 items-start">
      {/* Date display */}
      <div className="shrink-0 flex flex-col gap-0.5 pt-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Date
        </p>
        <p className="text-6xl font-bold text-gray-900 leading-none">{day}</p>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-gray-100 shrink-0" />

      {/* Timeline */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto max-h-96">
        {hasContent ? (
          groups.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-2">
              {group.time && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {formatTime(group.time)}
                  {group.endTime ? ` – ${formatTime(group.endTime)}` : ""}
                </p>
              )}
              {group.entries.map((entry, ei) => (
                <div
                  key={entry.taskId ?? ei}
                  className="flex items-center gap-3"
                >
                  <span
                    className={`shrink-0 rounded-lg px-3 py-1 text-xs font-semibold ${entry.pillCls}`}
                  >
                    {entry.pillLabel}
                  </span>
                  {entry.taskId && onUpdateTaskText ? (
                    <EditableTaskText
                      text={entry.text}
                      textCls={entry.textCls}
                      strikethrough={entry.strikethrough}
                      onCommit={(text) =>
                        onUpdateTaskText(entry.taskId as string, text)
                      }
                    />
                  ) : (
                    <span
                      className={`text-sm font-medium ${entry.textCls} ${entry.strikethrough ? "line-through opacity-60" : ""}`}
                    >
                      {entry.text}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 mt-2">
            Nothing scheduled for this day.
          </p>
        )}
      </div>
    </div>
  );
}
