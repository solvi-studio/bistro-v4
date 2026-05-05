"use client";

import { RefObject, useCallback } from "react";
import {
  NodeToolbar as FlowNodeToolbar,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { Bold, Copy, Italic, Strikethrough, Trash2 } from "lucide-react";
import { StickyData, STICKY_COLORS } from "@/components/mind-map/nodes/StickyNode";
import { TextBoxData, FontSize } from "@/components/mind-map/nodes/TextBoxNode";

// ─── Types ─────────────────────────────────────────────────────────────────────

type StickyProps = {
  nodeType: "sticky";
  id: string;
  data: StickyData;
  selected: boolean;
};

type TextBoxProps = {
  nodeType: "textbox";
  id: string;
  data: TextBoxData;
  selected: boolean;
  editorRef: RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  onStartEditing: () => void;
};

type Props = StickyProps | TextBoxProps;

// ─── Shared primitives ─────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-4 bg-gray-200 mx-0.5 shrink-0" />;
}

function ToolBtn({
  title,
  onClick,
  onMouseDown,
  active,
  danger,
  children,
}: {
  title?: string;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseDown={onMouseDown}
      className={[
        "h-6 min-w-6 px-1 rounded-md flex items-center justify-center font-medium transition-colors",
        active
          ? "bg-gray-100 text-gray-900"
          : danger
          ? "text-gray-400 hover:bg-red-50 hover:text-red-500"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ─── Sticky section ────────────────────────────────────────────────────────────

const STICKY_FONT_SIZES = [
  { label: "S", value: 12 },
  { label: "M", value: 14 },
  { label: "L", value: 18 },
] as const;

function StickyControls({ id, data }: { id: string; data: StickyData }) {
  const { updateNodeData, addNodes, deleteElements, getNode } = useReactFlow();

  const handleColor = (color: string) => updateNodeData(id, { color });
  const handleFontSize = (fontSize: number) => updateNodeData(id, { fontSize });

  const handleDuplicate = useCallback(() => {
    const node = getNode(id);
    if (!node) return;
    addNodes({
      ...node,
      id: `sticky-${Date.now()}`,
      position: { x: node.position.x + 20, y: node.position.y + 20 },
      selected: false,
    });
  }, [id, getNode, addNodes]);

  const handleDelete = () => deleteElements({ nodes: [{ id }], edges: [] });

  return (
    <>
      {STICKY_COLORS.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          title={label}
          onClick={() => handleColor(value)}
          className="w-4 h-4 rounded-full border border-gray-300 hover:scale-125 transition-transform shrink-0"
          style={{
            background: value,
            outline: data.color === value ? "2px solid #6366f1" : "none",
            outlineOffset: 1,
          }}
        />
      ))}

      <Divider />

      {STICKY_FONT_SIZES.map(({ label, value }) => (
        <ToolBtn
          key={label}
          active={data.fontSize === value}
          onClick={() => handleFontSize(value)}
        >
          {label}
        </ToolBtn>
      ))}

      <Divider />

      <ToolBtn title="Duplicate" onClick={handleDuplicate}>
        <Copy size={13} />
      </ToolBtn>

      <ToolBtn title="Delete" danger onClick={handleDelete}>
        <Trash2 size={13} />
      </ToolBtn>
    </>
  );
}

// ─── TextBox section ───────────────────────────────────────────────────────────

const TEXTBOX_FONT_SIZES: { label: string; key: FontSize }[] = [
  { label: "S",  key: "sm" },
  { label: "M",  key: "md" },
  { label: "L",  key: "lg" },
  { label: "XL", key: "xl" },
];

function TextBoxControls({
  id,
  data,
  isEditing,
  onStartEditing,
}: {
  id: string;
  data: TextBoxData;
  isEditing: boolean;
  onStartEditing: () => void;
}) {
  const { updateNodeData, deleteElements } = useReactFlow();

  const execFormat = (command: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isEditing) onStartEditing();
    setTimeout(() => document.execCommand(command, false), 0);
  };

  const handleFontSize = (key: FontSize) => updateNodeData(id, { fontSize: key });
  const handleDelete = () => deleteElements({ nodes: [{ id }], edges: [] });

  return (
    <>
      <ToolBtn title="Bold" onMouseDown={execFormat("bold")}>
        <Bold size={13} />
      </ToolBtn>
      <ToolBtn title="Italic" onMouseDown={execFormat("italic")}>
        <Italic size={13} />
      </ToolBtn>
      <ToolBtn title="Strikethrough" onMouseDown={execFormat("strikeThrough")}>
        <Strikethrough size={13} />
      </ToolBtn>

      <Divider />

      {TEXTBOX_FONT_SIZES.map(({ label, key }) => (
        <ToolBtn
          key={key}
          active={data.fontSize === key}
          onClick={() => handleFontSize(key)}
        >
          {label}
        </ToolBtn>
      ))}

      <Divider />

      <ToolBtn title="Delete" danger onClick={handleDelete}>
        <Trash2 size={13} />
      </ToolBtn>
    </>
  );
}

// ─── Unified export ────────────────────────────────────────────────────────────

export default function NodeToolbar(props: Props) {
  return (
    <FlowNodeToolbar isVisible={props.selected} position={Position.Top} offset={8}>
      <div className="bg-white border border-gray-200 rounded-xl shadow-md px-2 py-1.5 flex items-center gap-1 text-xs select-none">
        {props.nodeType === "sticky" ? (
          <StickyControls id={props.id} data={props.data} />
        ) : (
          <TextBoxControls
            id={props.id}
            data={props.data}
            isEditing={props.isEditing}
            onStartEditing={props.onStartEditing}
          />
        )}
      </div>
    </FlowNodeToolbar>
  );
}
