"use client";

import { useReactFlow } from "@xyflow/react";
import { GripVertical } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  MIND_MAP_GROUPS,
  type MindMapGroup,
} from "@/components/mind-map/constants/topics";
import {
  spawnTopicNode,
  TOPIC_DND_MIME,
  type TopicDragPayload,
  VIDEO_DND_MIME,
} from "@/components/mind-map/utils/spawnTopic";
import { loadCustomItems, saveCustomItems } from "@/utils/mind-map-store";

export default function MindMapSidePanel() {
  const { addNodes } = useReactFlow();
  const params = useSearchParams();
  const scriptId = params.get("script");
  const mapId = scriptId ?? "default";

  // "Add Your Own" disabled for now — state kept commented for later re-enable.
  // const [addingKey, setAddingKey] = useState<string | null>(null);
  // const [addValue, setAddValue] = useState("");
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
    spawnTopicNode({ addNodes }, group, label);
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
  // Disabled for now along with the "Add Your Own" UI; kept for later re-enable.
  // function handleAddSubmit(sectionKey: string) {
  //   const text = addValue.trim();
  //   if (!text) return;
  //   setCustomItems((prev) => ({
  //     ...prev,
  //     [sectionKey]: [...(prev[sectionKey] ?? []), text],
  //   }));
  //   setAddValue("");
  //   setAddingKey(null);
  // }

  return (
    <div className="flex flex-col gap-6">
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

                  {/* "Add Your Own" disabled for now — kept for later re-enable.
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
                          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubmit(sectionKey)}
                          className="shrink-0 rounded-xl bg-primary px-3 text-xs font-semibold text-white"
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
                  */}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Video Analysis — draggable card that drops a VideoDropNode onto canvas */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold" style={{ color: "#0f766e" }}>
          Video Analysis
        </h3>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: draggable card */}
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(VIDEO_DND_MIME, "1");
            e.dataTransfer.effectAllowed = "copy";
          }}
          className="flex cursor-grab items-center gap-3 rounded-2xl px-4 py-5 transition-all hover:brightness-95 active:cursor-grabbing"
          style={{ backgroundColor: "#e4f2eb" }}
        >
          <GripVertical
            size={20}
            className="shrink-0"
            style={{ color: "#4caf87" }}
          />
          <p
            className="text-sm leading-relaxed"
            style={{ color: "#2e7d5a" }}
          >
            Your inspiration videos, your past posts or whatever you want to
            replicate in your next idea
          </p>
        </div>
      </div>
    </div>
  );
}
