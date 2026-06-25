"use client";

import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  location?: string;
  onChange: (location: string | undefined) => void;
}

export default function EventLocationEditor({ location, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(location ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    const val = draft.trim();
    onChange(val || undefined);
    setEditing(false);
  }

  function cancel() {
    setDraft(location ?? "");
    setEditing(false);
  }

  return (
    <div className="flex items-start gap-3 text-sm">
      <MapPin size={15} className="shrink-0 text-gray-400 mt-0.5" />
      {editing ? (
        <div className="flex flex-col gap-2 flex-1">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
            placeholder="Add location"
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={commit}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancel}
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
            setDraft(location ?? "");
            setEditing(true);
          }}
          className={`text-left transition-colors hover:text-primary ${
            location ? "text-gray-700" : "text-gray-400"
          }`}
        >
          {location || "Add location"}
        </button>
      )}
    </div>
  );
}
