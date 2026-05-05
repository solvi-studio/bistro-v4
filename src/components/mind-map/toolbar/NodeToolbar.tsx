"use client";

import { RefObject, useCallback } from "react";
import {
  NodeToolbar as FlowNodeToolbar,
  Position,
  useReactFlow,
} from "@xyflow/react";
import { Bold, Copy, Italic, Palette, Strikethrough, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StickyData, STICKY_COLORS } from "@/components/mind-map/nodes/StickyNode";
import { TextBoxData, FontSize } from "@/components/mind-map/nodes/TextBoxNode";
import { ShapeData, ShapeType, SHAPE_FILL_COLORS, SHAPE_ICONS, SHAPE_TYPES } from "@/components/mind-map/nodes/ShapeNode";

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

type ShapeProps = {
  nodeType: "shape";
  id: string;
  data: ShapeData;
  selected: boolean;
};

type Props = StickyProps | TextBoxProps | ShapeProps;

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

// ─── Shared sub-controls ──────────────────────────────────────────────────────

function ColorPickerRow({
  value,
  onChange,
  presets,
}: {
  value: string;
  onChange: (color: string) => void;
  presets: readonly { label: string; value: string }[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      {presets.map(({ label, value: pv }) => (
        <button
          key={pv}
          type="button"
          title={label}
          onClick={() => onChange(pv)}
          className="w-4 h-4 rounded-full border border-gray-300 hover:scale-125 transition-transform shrink-0"
          style={{
            background: pv,
            outline: value === pv ? "2px solid #6366f1" : "none",
            outlineOffset: 1,
          }}
        />
      ))}
      <input
        ref={inputRef}
        type="color"
        value={value.startsWith("#") ? value : "#ffffff"}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
      />
      <ToolBtn title="Custom color" onClick={() => inputRef.current?.click()}>
        <Palette size={13} />
      </ToolBtn>
    </>
  );
}

function FontSizeRow({
  value,
  onChange,
  presets,
}: {
  value: number;
  onChange: (n: number) => void;
  presets: readonly { label: string; value: number }[];
}) {
  const [inputVal, setInputVal] = useState(String(value));

  useEffect(() => {
    setInputVal(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 1 && n <= 200) onChange(n);
    else setInputVal(String(value));
  };

  return (
    <>
      {presets.map(({ label, value: pv }) => (
        <ToolBtn
          key={label}
          active={value === pv}
          onClick={() => onChange(pv)}
        >
          {label}
        </ToolBtn>
      ))}
      <div className="nodrag nopan flex items-center border border-gray-200 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-gray-400">
        <input
          type="number"
          min={1}
          max={200}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(inputVal);
            e.stopPropagation();
          }}
          className="w-10 text-center text-xs text-gray-800 bg-transparent px-1.5 py-0.5 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="text-[10px] text-gray-400 pr-1.5 select-none">px</span>
      </div>
    </>
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

  return (
    <>
      <ColorPickerRow
        value={data.color}
        onChange={(color) => updateNodeData(id, { color })}
        presets={STICKY_COLORS}
      />

      <Divider />

      <FontSizeRow
        value={data.fontSize ?? 14}
        onChange={(fontSize) => updateNodeData(id, { fontSize })}
        presets={STICKY_FONT_SIZES}
      />

      <Divider />

      <ToolBtn title="Duplicate" onClick={handleDuplicate}>
        <Copy size={13} />
      </ToolBtn>

      <ToolBtn title="Delete" danger onClick={() => deleteElements({ nodes: [{ id }], edges: [] })}>
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

// ─── Shape section ─────────────────────────────────────────────────────────────

const SHAPE_FONT_SIZES = [
  { label: "S", value: 12 },
  { label: "M", value: 14 },
  { label: "L", value: 18 },
] as const;

function ShapeControls({ id, data }: { id: string; data: ShapeData }) {
  const { updateNodeData, addNodes, deleteElements, getNode } = useReactFlow();

  const handleDuplicate = useCallback(() => {
    const node = getNode(id);
    if (!node) return;
    addNodes({
      ...node,
      id: `shape-${Date.now()}`,
      position: { x: node.position.x + 20, y: node.position.y + 20 },
      selected: false,
    });
  }, [id, getNode, addNodes]);

  return (
    <>
      {SHAPE_TYPES.map((s) => (
        <ToolBtn
          key={s}
          title={s.charAt(0).toUpperCase() + s.slice(1)}
          active={data.shape === s}
          onClick={() => updateNodeData(id, { shape: s })}
        >
          {SHAPE_ICONS[s]}
        </ToolBtn>
      ))}

      <Divider />

      <ColorPickerRow
        value={data.fillColor}
        onChange={(fillColor) => updateNodeData(id, { fillColor })}
        presets={SHAPE_FILL_COLORS}
      />

      <Divider />

      <FontSizeRow
        value={data.fontSize ?? 14}
        onChange={(fontSize) => updateNodeData(id, { fontSize })}
        presets={SHAPE_FONT_SIZES}
      />

      <Divider />

      <ToolBtn title="Duplicate" onClick={handleDuplicate}>
        <Copy size={13} />
      </ToolBtn>

      <ToolBtn title="Delete" danger onClick={() => deleteElements({ nodes: [{ id }], edges: [] })}>
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
        ) : props.nodeType === "shape" ? (
          <ShapeControls id={props.id} data={props.data} />
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
