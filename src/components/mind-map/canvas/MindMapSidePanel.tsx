"use client";

import { useReactFlow } from "@xyflow/react";
import { GripVertical } from "lucide-react";
import {
  MIND_MAP_GROUPS,
  type MindMapGroup,
} from "@/components/mind-map/constants/topics";
import {
  spawnContentNode,
  TOPIC_DND_MIME,
  type TopicDragPayload,
  VIDEO_DND_MIME,
} from "@/components/mind-map/utils/spawnTopic";

export default function MindMapSidePanel() {
  const { addNodes } = useReactFlow();

  function spawnTopic(group: MindMapGroup, label: string) {
    if (!group.category) return;
    spawnContentNode({ addNodes }, group.category, label);
  }

  function handleDragStart(
    e: React.DragEvent,
    group: MindMapGroup,
    label: string,
  ) {
    if (!group.category) return;
    const payload: TopicDragPayload = {
      category: group.category,
      header: label,
    };
    e.dataTransfer.setData(TOPIC_DND_MIME, JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  }

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

                  {section.items.map((item) => (
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
                      <GripVertical size={13} className="shrink-0 opacity-50" />
                      <span className="line-clamp-2">{item}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Video Analysis — draggable card that drops a VideoNode onto canvas */}
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
          <p className="text-sm leading-relaxed" style={{ color: "#2e7d5a" }}>
            Your inspiration videos, your past posts or whatever you want to
            replicate in your next idea
          </p>
        </div>
      </div>
    </div>
  );
}
