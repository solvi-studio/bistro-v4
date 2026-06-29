"use client";

import { ChevronDown, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createIdea } from "@/lib/db/actions/ideas";
import type { Platform } from "@/types/creative";
import {
  clearDraft,
  EMPTY_DRAFT,
  getDraft,
  PLATFORMS,
  type ScriptDraft,
  saveDraft,
} from "@/utils/creative";
import { PlatformIcon } from "./platformIcons";

// Create-project modal (Image #2). Collects project name, goal, and target
// platform, then spins up a script + its mind map. Replaces the old compose
// page / "Your Creative Helper" tab as the entry point for a new idea.
//
// Typography note: the whole modal renders in Poppins (font-poppins), with the
// title in Poppins Medium (font-medium = weight 500) per the design. See
// CLAUDE.md "Typography" for the project-wide convention.
export default function CreateProjectModal() {
  const router = useRouter();
  const params = useSearchParams();
  const folder = params.get("folder") ?? "f-default";

  const [draft, setDraft] = useState<ScriptDraft>(() => EMPTY_DRAFT);
  const [platformOpen, setPlatformOpen] = useState(false);
  const restored = useRef(false);
  const platformRef = useRef<HTMLDivElement>(null);

  // Restore an in-progress draft once on mount (storage is client-only).
  // Merge over EMPTY_DRAFT so a stale draft from the old compose shape
  // (purpose/intro/outro) can't leave name/goal/platform undefined.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const saved = getDraft(folder);
    if (saved) {
      setDraft({
        name: saved.name ?? "",
        goal: saved.goal ?? "",
        platform: saved.platform ?? "",
      });
    }
  }, [folder]);

  // Persist edits, debounced.
  useEffect(() => {
    if (!restored.current) return;
    const t = setTimeout(() => saveDraft(folder, draft), 400);
    return () => clearTimeout(t);
  }, [folder, draft]);

  // Close the platform dropdown on an outside click.
  useEffect(() => {
    if (!platformOpen) return;
    function onDown(e: MouseEvent) {
      if (!platformRef.current?.contains(e.target as Node)) {
        setPlatformOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [platformOpen]);

  const canSubmit = draft.name.trim().length > 0 && draft.platform !== "";
  const selected = PLATFORMS.find((p) => p.id === draft.platform);

  function close() {
    router.push("/creative");
  }

  function pickPlatform(platform: Platform) {
    setDraft((d) => ({ ...d, platform }));
    setPlatformOpen(false);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    try {
      const script = await createIdea(draft);
      clearDraft(folder);
      router.push(`/mind-map?script=${encodeURIComponent(script.id)}`);
    } catch (err) {
      console.error("Failed to create idea:", err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 font-poppins">
      {/* Backdrop click closes. */}
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div className="relative z-10 w-full max-w-xl rounded-3xl bg-[#eef2fb] p-6 shadow-2xl md:p-8">
        <div className="mb-6 flex items-center justify-center">
          <h2 className="text-2xl font-medium text-gray-900 md:text-[28px]">
            Create your new project
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="project-name"
              className="text-[15px] font-semibold text-gray-900"
            >
              What are you working on?
            </label>
            <input
              id="project-name"
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
              placeholder="Name your project"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-primary"
            />
          </div>

          <div>
            <label
              htmlFor="project-goal"
              className="text-[15px] font-semibold text-gray-900"
            >
              What are you trying to achieve?
            </label>
            <textarea
              id="project-goal"
              value={draft.goal}
              onChange={(e) =>
                setDraft((d) => ({ ...d, goal: e.target.value }))
              }
              placeholder="Describe your project and goals"
              className="mt-2 h-28 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-primary"
            />
          </div>

          {/* Platform picker — custom dropdown so each option shows its brand
              icon (native <select> options can't render SVGs). */}
          <div ref={platformRef} className="relative">
            <span
              id="platform-label"
              className="text-[15px] font-semibold text-gray-900"
            >
              Which platform do you want to create your masterpiece?
            </span>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={platformOpen}
              aria-labelledby="platform-label"
              onClick={() => setPlatformOpen((o) => !o)}
              className="mt-2 flex w-full items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-primary"
            >
              {selected ? (
                <span className="flex items-center gap-2.5 text-gray-800">
                  <PlatformIcon platform={selected.id} size={20} />
                  {selected.label}
                </span>
              ) : (
                <span className="text-gray-400">Select your go-to channel</span>
              )}
              <ChevronDown
                size={18}
                className={`shrink-0 text-gray-400 transition-transform ${
                  platformOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {platformOpen && (
              <ul className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
                {PLATFORMS.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => pickPlatform(p.id)}
                      className={`flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50 ${
                        draft.platform === p.id ? "bg-gray-50" : ""
                      }`}
                    >
                      <PlatformIcon platform={p.id} size={20} />
                      {p.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="min-h-11 rounded-full bg-primary px-10 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-(--color-primary-hover) disabled:cursor-not-allowed disabled:opacity-40"
          >
            Let's go!
          </button>
        </div>
      </div>
    </div>
  );
}
