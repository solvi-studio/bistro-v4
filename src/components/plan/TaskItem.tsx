"use client";

import { CalendarIcon, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PlanTask } from "@/types/plan";

interface Props {
  task: PlanTask;
  onUpdate: (updated: PlanTask) => void;
  onDelete?: (id: string) => void;
  // "chip" = tinted pill (legacy list); "card" = white card (phase board).
  variant?: "chip" | "card";
  // Accent colour for the card variant's text (matches its column).
  accentCls?: string;
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

function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${mStr} ${period}`;
}


export default function TaskItem({
  task,
  onUpdate,
  onDelete,
  variant = "chip",
  accentCls,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<"date" | "time">("date");
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const calBtnRef = useRef<HTMLButtonElement>(null);

  function handleCalendarClick() {
    const rect = calBtnRef.current?.getBoundingClientRect();
    if (rect) {
      setPickerPos({ top: rect.bottom + 6, left: rect.right - 224 });
    }
    setShowPicker((v) => !v);
    setPickerTab("date");
    setTimeout(() => inputRef.current?.showPicker?.(), 50);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    onUpdate({ ...task, scheduledDate: e.target.value });
  }

  function handleStartTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    onUpdate({ ...task, scheduledStartTime: e.target.value || undefined });
  }

  function handleEndTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    onUpdate({ ...task, scheduledEndTime: e.target.value || undefined });
  }

  function startEdit() {
    setDraft(task.text);
    setEditing(true);
  }

  function commitEdit() {
    const text = draft.trim();
    if (text && text !== task.text) onUpdate({ ...task, text });
    setEditing(false);
  }

  const inputCls =
    "w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

  const pickerContent = (
    <div
      style={{ top: pickerPos.top, left: pickerPos.left }}
      className="fixed z-[9999] bg-white rounded-2xl shadow-lg border border-gray-100 p-3 w-56"
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-3 rounded-lg bg-gray-100 p-0.5">
        {(["date", "time"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setPickerTab(tab)}
            className={`flex-1 rounded-md py-1 text-xs font-semibold transition-colors capitalize ${
              pickerTab === tab
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {pickerTab === "date" ? (
        <>
          <p className="text-xs text-gray-400 mb-2">Which day?</p>
          <input
            ref={inputRef}
            type="date"
            defaultValue={task.scheduledDate ?? ""}
            onChange={handleDateChange}
            className={inputCls}
          />
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-xs text-gray-400 mb-1">Start time</p>
            <input
              type="time"
              value={task.scheduledStartTime ?? ""}
              onChange={handleStartTimeChange}
              className={inputCls}
            />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">End time</p>
            <input
              type="time"
              value={task.scheduledEndTime ?? ""}
              onChange={handleEndTimeChange}
              className={inputCls}
            />
          </div>
        </div>
      )}
    </div>
  );

  const picker =
    showPicker && typeof document !== "undefined"
      ? createPortal(pickerContent, document.body)
      : null;

  // ── Board card: white card with the text and a calendar trigger inside ──
  if (variant === "card") {
    return (
      <div className="group relative">
        <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm">
          {editing ? (
            <input
              // biome-ignore lint/a11y/noAutofocus: focus follows the user's click to edit
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setEditing(false);
              }}
              className={`min-w-0 flex-1 bg-transparent text-[13px] font-medium outline-none ${accentCls ?? "text-gray-700"}`}
            />
          ) : (
            <button
              type="button"
              onClick={startEdit}
              title="Click to edit"
              className={`min-w-0 flex-1 truncate text-left text-[13px] font-medium ${accentCls ?? "text-gray-700"}`}
            >
              {task.text}
            </button>
          )}

          {task.scheduledDate && (
            <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
              {formatDate(task.scheduledDate)}
            </span>
          )}

          <button
            ref={calBtnRef}
            type="button"
            onClick={handleCalendarClick}
            aria-label={task.scheduledDate ? "Change date" : "Add date"}
            className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100"
          >
            <CalendarIcon size={15} />
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              aria-label="Delete task"
              className="shrink-0 rounded-md p-1 text-gray-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
        {picker}
      </div>
    );
  }

  // ── Chip: original tinted-pill layout ──────────────────────────────────
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div
        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium ${COLOR_MAP[task.colorTag]}`}
      >
        {task.text}
      </div>

      <div className="shrink-0">
        {task.scheduledDate ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
              {formatDate(task.scheduledDate)}
            </span>
            <button
              ref={calBtnRef}
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
            ref={calBtnRef}
            type="button"
            onClick={handleCalendarClick}
            aria-label="Add date"
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <CalendarIcon size={16} className="text-gray-400" />
          </button>
        )}

        {picker}
      </div>
    </div>
  );
}
