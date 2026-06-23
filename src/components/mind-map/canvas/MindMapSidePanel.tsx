"use client";

import { useReactFlow } from "@xyflow/react";
import { GripVertical, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MIND_MAP_GROUPS,
  type MindMapGroup,
} from "@/components/mind-map/constants/topics";
import {
  spawnTopicNode,
  TOPIC_DND_MIME,
  type TopicDragPayload,
} from "@/components/mind-map/utils/spawnTopic";
import { getScripts, platformLabel } from "@/utils/creative";
import { loadCustomItems, saveCustomItems } from "@/utils/mind-map-store";

export default function MindMapSidePanel() {
  const { addNodes, addEdges, getNode, getNodes } = useReactFlow();
  const params = useSearchParams();
  const scriptId = params.get("script");
  const mapId = scriptId ?? "default";

  // The active script — drives the read-only platform/goal box above the
  // shortlist. Copied verbatim from the create-project modal; not editable here.
  const script = useMemo(
    () =>
      scriptId ? (getScripts().find((s) => s.id === scriptId) ?? null) : null,
    [scriptId],
  );

  // Which section's "Add Your Own" input is open, and its draft value.
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [addValue, setAddValue] = useState("");
  // User-added topics, kept in the panel as selectable chips (per section).
  // They only land on the mind map when their chip is pressed. Persisted per
  // map so the shortlist survives leaving and returning to the canvas.
  // Init empty (matches SSR), then hydrate from storage after mount.
  const [customItems, setCustomItems] = useState<Record<string, string[]>>({});
  const restored = useRef(false);

  useEffect(() => {
    setCustomItems(loadCustomItems(mapId));
    restored.current = true;
  }, [mapId]);

  // Persist the shortlist, debounced — gated until the saved value has loaded
  // so the initial empty state never overwrites it.
  useEffect(() => {
    if (!restored.current) return;
    const t = setTimeout(() => saveCustomItems(mapId, customItems), 300);
    return () => clearTimeout(t);
  }, [mapId, customItems]);

  // Click spawns at the hub's default stagger; drag (below) lets the cursor
  // decide placement. Both funnel through the shared spawn helper.
  function spawnTopic(group: MindMapGroup, label: string) {
    spawnTopicNode({ addNodes, addEdges, getNode, getNodes }, group, label);
  }

  function handleDragStart(
    e: React.DragEvent,
    group: MindMapGroup,
    label: string,
  ) {
    const payload: TopicDragPayload = { hubId: group.hubId, label };
    e.dataTransfer.setData(TOPIC_DND_MIME, JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  }

  // Add the typed topic to the section's chip list — does NOT spawn a node.
  function handleAddSubmit(sectionKey: string) {
    const text = addValue.trim();
    if (!text) return;
    setCustomItems((prev) => ({
      ...prev,
      [sectionKey]: [...(prev[sectionKey] ?? []), text],
    }));
    setAddValue("");
    setAddingKey(null);
  }

  return (
    // Chrome (scroll, padding, heading bar) is owned by CreativeHelperSidebar;
    // this renders just the shortlist content nested in its tab content area.
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-bold text-gray-800">Your idea</h2>

      {/* Read-only goal box — platform + description copied from the create
          step. Shown above the shortlist; not editable here. */}
      {script && (
        <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          {script.platform && (
            <span className="w-fit rounded-full bg-[var(--color-primary)] px-3 py-1 text-[11px] font-semibold text-white">
              {platformLabel(script.platform)}
            </span>
          )}
          <p className="text-sm text-gray-700">
            {script.goal?.trim() || script.title}
          </p>
        </div>
      )}

      {MIND_MAP_GROUPS.filter((group) => !group.fromScript).map((group) => {
        const sections = group.sections;

        return (
          <div key={group.hubId} className="flex flex-col gap-3">
            <h3 className="text-sm font-bold" style={{ color: group.leafText }}>
              {group.hubLabel}
            </h3>

            {sections.map((section, si) => {
              const sectionKey = `${group.hubId}:${si}`;
              return (
                <div
                  key={section.label ?? sectionKey}
                  className="flex flex-col gap-2"
                >
                  {section.label && (
                    <p className="text-xs font-semibold text-gray-500">
                      {section.label}
                    </p>
                  )}

                  {[...section.items, ...(customItems[sectionKey] ?? [])].map(
                    (item) => (
                      <button
                        key={`${sectionKey}-${item}`}
                        type="button"
                        draggable
                        onDragStart={(e) => handleDragStart(e, group, item)}
                        onClick={() => spawnTopic(group, item)}
                        title="Click to add, or drag onto the canvas"
                        className="flex cursor-grab items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-transform hover:-translate-y-0.5 active:cursor-grabbing"
                        style={{
                          backgroundColor: group.leafBg,
                          color: group.leafText,
                        }}
                      >
                        <GripVertical
                          size={13}
                          className="shrink-0 opacity-50"
                        />
                        <span className="line-clamp-2">{item}</span>
                      </button>
                    ),
                  )}

                  {section.allowAdd &&
                    (addingKey === sectionKey ? (
                      <div className="flex gap-1.5">
                        <input
                          // biome-ignore lint/a11y/noAutofocus: input appears on user click
                          autoFocus
                          value={addValue}
                          onChange={(e) => setAddValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddSubmit(sectionKey);
                            if (e.key === "Escape") setAddingKey(null);
                          }}
                          placeholder="Your own topic…"
                          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-[var(--color-primary)]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubmit(sectionKey)}
                          className="shrink-0 rounded-xl bg-[var(--color-primary)] px-3 text-xs font-semibold text-white"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingKey(sectionKey);
                          setAddValue("");
                        }}
                        className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-3 py-2.5 text-left text-xs font-medium text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600"
                      >
                        <Plus size={13} className="shrink-0" />
                        Add Your Own
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
