"use client";

import { useReactFlow } from "@xyflow/react";
import { GripVertical, Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  leafNodeStyle,
  MIND_MAP_GROUPS,
  type MindMapGroup,
  type TopicSection,
} from "@/components/mind-map/constants/topics";
import { EDGE_MARKER } from "@/components/mind-map/edges/edgeTypes";
import { getScripts } from "@/utils/creative";

function truncate(text: string, max = 48): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

export default function MindMapSidePanel() {
  const { addNodes, addEdges, getNode, getNodes } = useReactFlow();
  const params = useSearchParams();
  const scriptId = params.get("script");

  // Big Picture topics come from the active script's compose answers.
  const bigPictureSections = useMemo<TopicSection[]>(() => {
    const script = scriptId
      ? getScripts().find((s) => s.id === scriptId)
      : null;
    return [
      {
        label: "The core concept",
        items: [script?.purpose?.trim() || "Your core concept"],
        allowAdd: false,
      },
      {
        label: "The Intro",
        items: [script?.intro?.trim() || "Your intro idea"],
        allowAdd: false,
      },
      {
        label: "The Outro",
        items: [script?.outro?.trim() || "Your outro idea"],
        allowAdd: false,
      },
    ];
  }, [scriptId]);

  // Which section's "Add Your Own" input is open, and its draft value.
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [addValue, setAddValue] = useState("");

  function spawnTopic(group: MindMapGroup, label: string) {
    const text = label.trim();
    if (!text) return;
    const hub = getNode(group.hubId);
    if (!hub) return;

    const siblings = getNodes().filter((n) =>
      n.id.startsWith(`topic-${group.hubId}-`),
    );
    const id = `topic-${group.hubId}-${Date.now()}`;
    const position = {
      x: hub.position.x + group.leafDir * 250,
      y: hub.position.y + siblings.length * 64 - 40,
    };

    addNodes({
      id,
      type: "default",
      position,
      data: { label: truncate(text) },
      style: leafNodeStyle(group.leafBg, group.leafText),
    });
    // Every spawned topic node is wired to its hub.
    addEdges({
      id: `e-${id}`,
      source: group.hubId,
      target: id,
      type: "labeled",
      data: { arrowEnd: true },
      markerEnd: EDGE_MARKER,
    });
  }

  function handleAddSubmit(group: MindMapGroup) {
    if (!addValue.trim()) return;
    spawnTopic(group, addValue);
    setAddValue("");
    setAddingKey(null);
  }

  return (
    <aside className="flex h-full flex-col gap-6 overflow-y-auto bg-[var(--color-surface)] p-5 pt-12 font-[var(--font-poppins)]">
      <h2 className="text-base font-bold text-gray-800">Your idea</h2>

      {MIND_MAP_GROUPS.map((group) => {
        const sections = group.fromScript ? bigPictureSections : group.sections;

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

                  {section.items.map((item) => (
                    <button
                      key={`${sectionKey}-${item}`}
                      type="button"
                      onClick={() => spawnTopic(group, item)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-transform hover:-translate-y-0.5"
                      style={{
                        backgroundColor: group.leafBg,
                        color: group.leafText,
                      }}
                    >
                      <GripVertical size={13} className="shrink-0 opacity-50" />
                      <span className="line-clamp-2">{item}</span>
                    </button>
                  ))}

                  {section.allowAdd &&
                    (addingKey === sectionKey ? (
                      <div className="flex gap-1.5">
                        <input
                          // biome-ignore lint/a11y/noAutofocus: input appears on user click
                          autoFocus
                          value={addValue}
                          onChange={(e) => setAddValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddSubmit(group);
                            if (e.key === "Escape") setAddingKey(null);
                          }}
                          placeholder="Your own topic…"
                          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-[var(--color-primary)]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubmit(group)}
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
    </aside>
  );
}
