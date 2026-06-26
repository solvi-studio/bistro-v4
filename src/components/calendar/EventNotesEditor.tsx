"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

interface Props {
  notes: string[];
  onChange: (notes: string[]) => void;
}

export default function EventNotesEditor({ notes, onChange }: Props) {
  const [draft, setDraft] = useState("");

  function add() {
    const text = draft.trim();
    if (!text) return;
    onChange([...notes, text]);
    setDraft("");
  }

  function remove(i: number) {
    onChange(notes.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="min-h-[7.5rem] rounded-lg border border-dashed border-gray-300 p-3">
        {notes.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {notes.map((n, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: notes have no stable id
              <li key={i} className="group flex items-start gap-2">
                <span className="flex-1 text-sm text-gray-700 leading-snug">
                  {n}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Remove note"
                  className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-gray-400">Add Notes</span>
        )}
      </div>

      {/* Add note input */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          placeholder="Add a note…"
          className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          aria-label="Add note"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-white disabled:opacity-40 transition-opacity"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}
