"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

interface Props {
  notes: string[];
  onChange: (notes: string[]) => void;
}

export default function EventNotesEditor({ notes, onChange }: Props) {
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");

  function add() {
    const text = draft.trim();
    if (!text) return;
    onChange([...notes, text]);
    setDraft("");
  }

  function remove(i: number) {
    onChange(notes.filter((_, idx) => idx !== i));
  }

  function startEdit(i: number) {
    setEditingIndex(i);
    setEditDraft(notes[i]);
  }

  function commitEdit() {
    if (editingIndex === null) return;
    const text = editDraft.trim();
    const next =
      text.length > 0
        ? notes.map((n, idx) => (idx === editingIndex ? text : n))
        : notes.filter((_, idx) => idx !== editingIndex);
    onChange(next);
    setEditingIndex(null);
  }

  function cancelEdit() {
    setEditingIndex(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="min-h-[7.5rem] rounded-lg border border-dashed border-gray-300 p-3">
        {notes.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {notes.map((n, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: notes have no stable id
              <li key={i} className="group flex items-start gap-2">
                {editingIndex === i ? (
                  <input
                    // biome-ignore lint/a11y/noAutofocus: user just clicked edit
                    autoFocus
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="flex-1 rounded-md border border-primary/40 px-1.5 py-0.5 text-sm text-gray-700 outline-none focus:border-primary"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    className="flex-1 text-left text-sm text-gray-700 leading-snug hover:text-primary transition-colors"
                  >
                    {n}
                  </button>
                )}
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
