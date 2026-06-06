"use client";

import {
  Handle,
  type Node,
  type NodeProps,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { CheckCircle2, Film, Loader2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import QuickConnectArrows from "@/components/mind-map/canvas/QuickConnectArrows";
import {
  analyzeVideo,
  isVideoFile,
  type VideoAnalysisStatus,
} from "@/utils/video-analysis";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VideoDropData = {
  status: VideoAnalysisStatus;
  fileName?: string;
  title?: string;
  note?: string;
};

export type VideoDropNodeType = Node<VideoDropData, "videoDrop">;

const HANDLE_CLS =
  "!w-2.5 !h-2.5 !rounded-full !border-2 !border-white !bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150";

// ─── Component ────────────────────────────────────────────────────────────────

export default function VideoDropNode({
  id,
  data,
  selected,
}: NodeProps<VideoDropNodeType>) {
  const { updateNodeData } = useReactFlow();
  const [isOver, setIsOver] = useState(false);

  const status = data.status ?? "idle";

  const handleFile = useCallback(
    async (file: File) => {
      if (!isVideoFile(file)) {
        updateNodeData(id, {
          status: "error",
          note: "Not a video file.",
        });
        return;
      }
      updateNodeData(id, { status: "analyzing", fileName: file.name });
      try {
        const result = await analyzeVideo(file);
        updateNodeData(id, {
          status: "done",
          fileName: result.fileName,
          title: result.title,
          note: result.note,
        });
      } catch {
        updateNodeData(id, { status: "error", note: "Analysis failed." });
      }
    },
    [id, updateNodeData],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="group relative w-[240px]">
      <QuickConnectArrows id={id} selected={!!selected} />

      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className={HANDLE_CLS}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={HANDLE_CLS}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className={HANDLE_CLS}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={HANDLE_CLS}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={HANDLE_CLS}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className={HANDLE_CLS}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={HANDLE_CLS}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className={HANDLE_CLS}
      />

      <div
        className={[
          "rounded-2xl p-4 bg-[#f1f4fb] shadow-sm transition-shadow",
          selected ? "ring-2 ring-[var(--color-primary)]" : "",
        ].join(" ")}
      >
        <div className="flex items-center gap-1.5 mb-3 text-gray-700">
          <Film size={14} />
          <span className="text-sm font-bold">Storyboard</span>
        </div>

        {/* biome-ignore lint/a11y/noStaticElementInteractions: native file drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsOver(true);
          }}
          onDragLeave={() => setIsOver(false)}
          onDrop={onDrop}
          className={[
            "nodrag nopan flex flex-col items-center justify-center gap-3",
            "rounded-2xl bg-white px-4 py-6 min-h-[140px] text-center",
            "border-2 border-dashed transition-colors",
            isOver
              ? "border-[var(--color-primary)] bg-indigo-50/40"
              : "border-gray-200",
          ].join(" ")}
        >
          {status === "analyzing" ? (
            <>
              <Loader2
                size={28}
                className="text-[var(--color-primary)] animate-spin"
              />
              <p className="text-sm text-gray-500 italic leading-snug">
                Analyzing
                <br />
                {data.fileName}
              </p>
            </>
          ) : status === "done" ? (
            <>
              <CheckCircle2 size={28} className="text-emerald-500" />
              <p className="text-sm text-gray-700 font-medium leading-snug">
                {data.title}
              </p>
              <p className="text-[11px] text-gray-400 leading-snug">
                {data.note}
              </p>
            </>
          ) : status === "error" ? (
            <>
              <Upload size={28} className="text-red-400" />
              <p className="text-sm text-red-500 italic leading-snug">
                {data.note ?? "Something went wrong"}
                <br />
                Drop a video to retry
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-400 italic leading-snug">
                Drag &amp; drop your
                <br />
                scene idea
              </p>
              <Upload size={26} className="text-gray-400" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
