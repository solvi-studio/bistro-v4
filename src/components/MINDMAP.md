# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev        # start dev server (Next.js 16, port 3000)
pnpm build      # production build
pnpm lint       # ESLint
pnpm tsc --noEmit  # type-check without emitting (no test suite exists yet)
```

## Stack

- **Next.js 16** / React 19 — App Router, all canvas code is `"use client"`
- **@xyflow/react v12** — ReactFlow for the canvas
- **Tailwind CSS v4** — utility classes only, no config file (PostCSS plugin)
- **lucide-react** — icons throughout
- **motion** — available but not yet used

## Architecture

The app is a single-page canvas. `app/page.tsx` renders `MindMapCanvas` directly — no routing.

### Composition root pattern

`MindMapCanvas.tsx` is the composition root. It owns no `useState` directly (except minimap visibility); all heavy logic lives in hooks or node components. The file structure mirrors concern boundaries:

```
src/components/mind-map/
  context/ToolContext.tsx          — active tool state (Tool union type + ToolProvider + useTool)
  hooks/
    useKeyboardShortcuts.ts        — Trie-based hotkey engine (module-level singletons, ref-counted listeners)
    useEraser.ts                   — eraser logic: drag-erase, cursor style injection, node handlers
  constants/initialData.ts         — INITIAL_NODES / INITIAL_EDGES (demo data, edges use "labeled" type)
  canvas/
    MindMapCanvas.tsx              — composition root: ReactFlowProvider, layout shell, ToolProvider wrapper
    Toolbar.tsx                    — left floating toolbar (absolute-positioned inside canvas container)
    EraserCursor.tsx               — dumb display: fixed circle div that tracks pointer when eraser active
  nodes/
    StickyNode.tsx                 — sticky note node (NodeResizer, two-layer structure, contentEditable)
    TextBoxNode.tsx                — transparent text node (NodeResizeControl lines, auto-delete when empty)
    ShapeNode.tsx                  — shape node: 5 SVG shapes (rect/circle/ellipse/hexagon/cloud), contentEditable text
    VideoDropNode.tsx              — video analysis node: TikTok URL + prompt → analyzeVideoMindmap (utils/video-mindmap-service), spawns results into the 4 hubs
    nodeTypes.ts                   — nodeTypes map passed to <ReactFlow>
  edges/
    LabeledEdge.tsx                — custom edge: smoothstep/straight/bezier, inline label edit, floating toolbar
    edgeTypes.ts                   — edgeTypes map passed to <ReactFlow>
  toolbar/
    NodeToolbar.tsx                — unified contextual toolbar for all node types (discriminated union on nodeType prop)
```

### Tool hook pattern

Each tool with non-trivial logic gets its own hook in `hooks/`. The hook:
- Calls `useReactFlow()` internally (must be used inside `ReactFlowProvider`)
- Calls `useTool()` to read `activeTool`
- Owns all state, `useEffect`s, and `useCallback` handlers for that tool
- Returns a typed `handlers` object + any display state (e.g. cursor position)

`MindMapCanvas.tsx` (composition root) only calls the hook and wires up the returned handlers — no tool logic lives in the canvas itself. Display-only concerns (like the eraser circle) go in a separate dumb component.

Example — `useEraser` returns `{ isEraserActive, eraserPos, handlers }` where `handlers` contains `onNodeClick`, `onNodeMouseEnter`, `onPointerDown/Up/Leave`. Canvas spreads these onto the wrapper div and `<ReactFlow>`.

### ToolContext

`Tool = "select" | "sticky" | "textbox" | "shape" | "connector" | "eraser" | "video"`. `ToolProvider` wraps the whole app via `MindMapCanvas`. Canvas behaviour (draggable, connectable, panOnDrag, cursor) is driven by `activeTool`. `pendingShape: ShapeType` tracks the selected shape for the shape sub-picker panel.

### Keyboard shortcuts (useKeyboardShortcuts)

Module-level Trie with ref-counted `window` listeners — safe for multiple hook instances. Shortcuts are registered per scope (`"global"` only so far). Key normalisation handles cross-platform aliases. The `isTyping` guard skips shortcuts when focus is inside an `input`, `textarea`, or `contentEditable`. Shortcuts: `V` select · `S` sticky · `T` textbox · `N` shape · `C` connector · `E` eraser · `B` video · `Delete/Backspace` delete selected · `Ctrl/Cmd+A` select all.

### Node structure (two-layer pattern)

Both custom nodes use a two-layer div to work around ReactFlow's handle clipping:
- **Outer div** — `group relative`, owns `Handle`s and `NodeResizer`/`NodeResizeControl`. **No** `overflow-hidden`.
- **Inner div** — `absolute inset-0`, owns background, text, decorations. Has `overflow-hidden`.

### contentEditable editing pattern

Both nodes use a mutable `isEditingRef` (not state) to guard a `useEffect` that syncs `data.text/html` → DOM. This prevents React from overwriting user keystrokes mid-edit. On `blur` → read `ref.current.innerText/innerHTML` → `updateNodeData`. `onDoubleClick` → `startEditing()` → `setTimeout(() => ref.current.focus(), 0)`.

### NodeToolbar (contextual floating toolbar)

`NodeToolbar.tsx` is a single component with a discriminated union prop (`nodeType: "sticky" | "textbox" | "shape"`). It renders ReactFlow's `<NodeToolbar>` which portals itself above the selected node. Formatting buttons (Bold/Italic/Strike) use `onMouseDown + e.preventDefault()` so the `contentEditable` div never loses focus before `document.execCommand` fires.

Two shared sub-controls live inside `NodeToolbar.tsx` and are reused across node types:

**`ColorPickerRow`** — renders preset color swatches + a `<Palette>` button that opens the browser's native `<input type="color">` spectrum picker. The hidden color input is always rendered (zero-size, `pointer-events: none`) and triggered programmatically via `.click()`.

**`FontSizeRow`** — renders S/M/L preset buttons + a number input field. The input is controlled by local state synced via `useEffect` from the parent `value` prop, so pressing a preset button updates the input in real time. Blur and Enter commit the typed value; invalid input reverts to last valid value. Input has `nodrag nopan` to prevent accidental node drag.

### LabeledEdge (custom edge type)

All edges use `type: "labeled"` which maps to `LabeledEdge`. Edge data shape: `{ label?: string; edgeType?: "smoothstep" | "straight" | "bezier" }`. The path type (smoothstep/straight/bezier) is stored in `data.edgeType` — the edge `type` is always `"labeled"`.

**Rendering:** calls the appropriate `getSmoothStepPath` / `getStraightPath` / `getBezierPath` helper, then renders `<BaseEdge>` + an `<EdgeLabelRenderer>` overlay positioned at `(labelX, labelY)` returned by the path helper.

**Floating toolbar:** when edge is selected, a toolbar appears above the midpoint via `EdgeLabelRenderer`. Buttons: Smooth / Line / Curve (path type switcher) · Type icon (open label edit) · Delete. Clicking a path type button calls `updateEdgeData(id, { edgeType })`.

**Label edit:** clicking the Type icon (or double-clicking an existing label) shows an `<input>` at the edge midpoint. Blur / Enter commits; Escape cancels. When selected but no label, a dashed `+ label` button appears.

**Connection guards:** `isValidConnection` in `MindMapCanvas` rejects self-loops (source === target) and duplicate edges (same source+target pair already exists).

### VideoDropNode (video tool)

The `video` tool places a `videoDrop` node. The node takes a TikTok share link (top input) and a free-text prompt (larger textarea below), then calls `analyzeVideoMindmap` (`utils/video-mindmap-service.ts` → `POST /api/v1/video-mindmap`). On success it spawns the returned suggestions as leaf nodes wired into the four hubs (big picture / tone / audience / composition). States: `idle` / `analyzing` / `done` / `error`. The service applies a 150s timeout and one automatic retry; on permanent failure the button becomes **Retry** so the user can re-run ("rebounce"). Form inputs and status live in `node.data`, so the canvas autosave (`saveCanvas`) persists them across reloads.
