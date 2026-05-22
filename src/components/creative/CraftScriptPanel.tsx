"use client";

import { ChevronsLeft, Maximize2 } from "lucide-react";
import type { ScriptDraft } from "@/utils/creative";

const QUESTIONS: { key: keyof ScriptDraft; label: string }[] = [
  { key: "purpose", label: "What's the main purpose of your upcoming videos?" },
  { key: "intro", label: "What's the intro you're thinking of?" },
  { key: "outro", label: "What's the outro you're thinking of?" },
];

interface Props {
  draft: ScriptDraft;
  onChange: (key: keyof ScriptDraft, value: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  onToggleCollapse: () => void;
}

export default function CraftScriptPanel({
  draft,
  onChange,
  onSubmit,
  canSubmit,
  onToggleCollapse,
}: Props) {
  return (
    <section className="flex flex-1 flex-col">
      <header className="mb-6 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Collapse helper"
          className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100"
        >
          <ChevronsLeft size={18} />
        </button>
        <h2 className="flex-1 text-lg font-bold text-gray-800">
          Craft Your Script
        </h2>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Expand panel"
          className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100"
        >
          <Maximize2 size={15} />
        </button>
      </header>

      <div className="flex flex-col gap-6">
        {QUESTIONS.map((q) => (
          <div key={q.key}>
            <label
              htmlFor={`craft-${q.key}`}
              className="text-[13px] font-medium text-gray-600"
            >
              {q.label}
            </label>
            <textarea
              id={`craft-${q.key}`}
              value={draft[q.key]}
              onChange={(e) => onChange(q.key, e.target.value)}
              className="mt-2 h-28 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-300 focus:border-[var(--color-primary)]"
              placeholder="Type your answer…"
            />
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Let's go!
        </button>
      </div>
    </section>
  );
}
