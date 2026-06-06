"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { addScript, type ScriptDraft } from "@/utils/creative";
import CraftScriptPanel from "./CraftScriptPanel";
import CreativeHelperSidebar from "./CreativeHelperSidebar";

const EMPTY_DRAFT: ScriptDraft = { purpose: "", intro: "", outro: "" };

export default function CreativeComposeClient() {
  const router = useRouter();
  const params = useSearchParams();
  const folder = params.get("folder") ?? "f-default";

  // Draft lives in component state ONLY — never persisted. Leaving the page
  // (back, sidebar, refresh) discards it; only submit writes to storage.
  const [draft, setDraft] = useState<ScriptDraft>(EMPTY_DRAFT);
  const [collapsed, setCollapsed] = useState(false);

  const canSubmit = Object.values(draft).some((v) => v.trim().length > 0);

  function handleChange(key: keyof ScriptDraft, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    const script = addScript(folder, draft);
    // replace() removes the compose page from history — carries text forward.
    router.replace(`/mind-map?script=${encodeURIComponent(script.id)}`);
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      {!collapsed && (
        <div className="hidden md:flex">
          <CreativeHelperSidebar />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-9">
        <CraftScriptPanel
          draft={draft}
          onChange={handleChange}
          onSubmit={handleSubmit}
          canSubmit={canSubmit}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onBack={() => router.back()}
        />
      </div>
    </div>
  );
}
