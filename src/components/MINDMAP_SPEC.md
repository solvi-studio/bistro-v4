# Minimalist Mind Map — Product Specification

**Stack:** Next.js · `@xyflow/react` · `perfect-freehand` · Tailwind CSS  
**Date:** 2026-05-01  
**Status:** In Progress (Day 7 complete)

---

## 1. Overview

A whiteboard-style mind map built on React Flow. The canvas is infinite and pannable. A fixed left-side vertical toolbar switches between interaction modes; each node surfaces a contextual toolbar on click. The aesthetic is minimal — clean whites/grays, no decorative chrome.

---

## 2. Architecture Decisions

| Concern | Decision | Reason |
|---|---|---|
| State | `useNodesState` + `useEdgesState` (React Flow built-ins) | Avoids external store for now; can migrate to Zustand if needed |
| Freehand draw | SVG overlay via `perfect-freehand` → stored as a custom `drawing` node | Keeps drawing strokes within the React Flow node graph |
| Eraser | Pointer-events mask on canvas; hit-test nodes & drawing strokes | Matches the ReactFlow eraser example approach |
| Toolbar mode | Global `activeTool` context/atom | Single source of truth for which tool is active |
| Persistence | `localStorage` (phase 1) → remote DB (phase 2) | Ship fast, defer auth |
| Modularity | Each cross-cutting concern (shortcuts, minimap, history, persistence) lives in its own hook; each UI region lives in its own component | Keeps `MindMapCanvas` as a thin composition root — it should have zero `useState` calls of its own |

---

## 3. Functional Requirements

Each feature is listed with **Priority**, **Est. Time**, **Risk**, then broken into detail.

---

### F-01 — Left Toolbar (Mode Switcher)

**Priority:** P0 — Blocker for everything else  
**Est. Time:** 0.5 day  
**Risk:** Low

**Description:**  
A fixed vertical strip on the left edge of the viewport containing icon buttons for each tool mode. Only one mode is active at a time. The active button is visually highlighted. The toolbar never scrolls or moves with the canvas.

**Details:**
- Buttons (in order): Select · Sticky Note · Text Box · Connector · Eraser · Freehand Draw
- Active tool highlighted with a filled background or accent border
- Icons are 20–24px, with a tooltip on hover (title attribute or small popover)
- `activeTool` state lives in a React context (or Zustand store) so all canvas handlers can read it
- Keyboard shortcuts map to each tool (see F-09)
- Toolbar is `position: fixed`, `z-index` above the canvas

**Flow:**
```
User clicks toolbar button
  → activeTool context updates
  → Canvas pointer-event handlers switch behavior
  → Active button receives highlight class
```

**Use-case:**  
User wants to draw freely — clicks the pen icon, cursor changes to crosshair, canvas pans are disabled, strokes appear on pointer-down.

---

### F-02 — Select Tool

**Priority:** P0  
**Est. Time:** 0.5 day  
**Risk:** Low

**Description:**  
Default mode. Allows single-click selection, drag-to-move, and rubber-band multi-select. Standard React Flow behavior, but the toolbar must explicitly set the canvas to this mode so other tools don't interfere.

**Details:**
- Single click on node → selects it, deselects others, shows Node Toolbar (F-07)
- Click on empty canvas → deselects all
- Drag on empty canvas → rubber-band selection box (React Flow `selectionOnDrag` prop)
- Drag on a selected node → moves the selection
- `Shift+click` → adds node to selection without deselecting others
- `Ctrl/Cmd+A` → select all nodes
- Selected nodes have a visible selection ring
- Edges can also be selected; selected edge highlights in accent color
- `Delete` / `Backspace` → deletes selected nodes/edges (with `onBeforeDelete` confirm guard if >3 items)
- When `activeTool !== 'select'`, `nodesConnectable` and `nodesDraggable` are disabled

**Flow:**
```
activeTool = 'select'
  → ReactFlow: nodesDraggable=true, panOnDrag=true, selectionOnDrag=true
  → onNodeClick → set selected node → show NodeToolbar
  → onPaneClick → clear selection
```

**Use-case:**  
User lays out 10 nodes, shift-clicks 4, drags them together to group them spatially.

---

### F-03 — Sticky Note Node

**Priority:** P0  
**Est. Time:** 1 day  
**Risk:** Low

**Description:**  
A draggable, resizable card that resembles a physical sticky note. Can be placed by clicking on the canvas while the Sticky Note tool is active.

**Details:**
- Clicking canvas with Sticky tool active → drops a sticky at that position (`screenToFlowPosition`)
- Default size: 200×200px; user can resize by dragging corner handle
- Background color defaults to `#fef9c3` (yellow); color can be changed from Node Toolbar
- Double-click on the body → enters inline edit mode (`contentEditable` div); click outside to commit
- Font: 14px, comfortable line-height
- `nodrag` class on the text area so editing doesn't move the node
- Sticky note has a subtle drop shadow and a folded bottom-right corner (CSS only)
- Node type: `sticky`; data shape: `{ text: string; color: string; fontSize: number }`
- Handles are hidden by default; appear on hover to allow connecting to other nodes

**Flow:**
```
activeTool = 'sticky'
  → onPaneClick → screenToFlowPosition(click coords) → addNode({ type: 'sticky', position, data })
  → activeTool resets to 'select' after placement
  → User double-clicks → contentEditable=true
  → Blur → commit text to node data via updateNodeData()
```

**Use-case:**  
Brainstorming session — user drops 6 yellow stickies, writes one idea on each, then connects them.

---

### F-04 — Text Box Node

**Priority:** P0  
**Est. Time:** 0.75 day  
**Risk:** Low

**Description:**  
A transparent, borderless text container. Intended for labels, headings, and annotations — not for idea cards. Lighter weight than a sticky note.

**Details:**
- Clicking canvas with Text Box tool → places node; immediately enters edit mode
- No background or border by default; only the text is visible
- Resize by dragging edge handle (width only; height auto-grows with content)
- Supports basic inline formatting from Node Toolbar: **Bold**, *Italic*, ~~strikethrough~~, font size (S/M/L/XL)
- Formatting stored as HTML string in `data.html`; rendered via `dangerouslySetInnerHTML` (sanitized with DOMPurify)
- Empty text box auto-deletes on blur if no content was entered
- Node type: `textbox`; data: `{ html: string; fontSize: 'sm'|'md'|'lg'|'xl' }`
- Handles hidden; connection possible but not the primary use-case

**Flow:**
```
activeTool = 'textbox'
  → onPaneClick → addNode({ type: 'textbox', ... }) → focus textarea immediately
  → Blur → commit; if empty → deleteElements({ nodes: [node] })
```

**Use-case:**  
User adds a "Phase 1" heading above a cluster of sticky notes.

---

### F-05 — Connector / Edge Drawing

**Priority:** P1  
**Est. Time:** 1 day  
**Risk:** Medium — handle registration UX is tricky

**Description:**  
Allows users to draw edges between nodes. Handles become visible when the Connector tool is active. Edges can be labeled and styled.

**Details:**
- When `activeTool = 'connector'`: node handles become visible and hoverable
- Dragging from a handle to another node's handle → creates an edge (`onConnect` + `addEdge`)
- Edge types available: `smoothstep` (default), `straight`, `bezier` — toggled from Edge Toolbar
- Double-clicking an edge → enters label edit mode (inline input rendered via `EdgeLabelRenderer`)
- Edge label stored in `edge.data.label`
- Clicking an edge → shows Edge Toolbar: change type, add label, delete
- `isValidConnection` prevents self-loops and duplicate edges
- Default edge style: gray `#9ca3af`, strokeWidth 1.5
- Selected edge: accent color, strokeWidth 2

**Flow:**
```
activeTool = 'connector'
  → Node handles become visible (CSS class toggle)
  → User drags handle → onConnectStart fires
  → Drop on target handle → onConnect → addEdge
  → Edge appears; activeTool stays 'connector' for multi-draw
```

**Use-case:**  
User connects "Problem" sticky to "Solution" sticky with a labeled arrow reading "resolves."

---

### F-06 — Eraser Tool

**Priority:** P0  
**Est. Time:** 1 day  
**Risk:** Medium — must handle both nodes and freehand strokes

**Description:**  
Eraser mode lets users delete nodes, edges, and freehand drawing strokes by hovering/clicking over them. Inspired by the ReactFlow whiteboard eraser example.

**Details:**
- When `activeTool = 'eraser'`:
  - Canvas pan is disabled
  - Cursor becomes a circle (CSS `cursor: none` + custom SVG circle overlay)
  - Pointer-down on a **node** → immediately deletes it (and its connected edges)
  - Pointer-down + drag over a **freehand stroke** node → deletes intersecting stroke nodes
  - Eraser radius: 20px (configurable via brush size slider in toolbar or scroll wheel)
  - Deleted items can be recovered with Undo (F-08)
  - No confirmation dialog — Undo is the safety net
- Implementation: use `onNodeMouseEnter` while `pointerDown` is tracked in a ref

**Flow:**
```
activeTool = 'eraser'
  → pointerdown → set isErasing=true (ref)
  → onNodeMouseEnter(node) + isErasing → deleteElements({ nodes: [node] })
  → pointerup → isErasing=false
```

**Use-case:**  
User sketched a freehand bubble that's in the wrong place — switches to eraser, swipes over it, it's gone.

---

### F-07 — Freehand Draw

**Priority:** P0  
**Est. Time:** 1.5 days  
**Risk:** High — performance-critical; SVG path generation needs tuning

**Description:**  
Allows drawing freehand strokes directly on the canvas using `perfect-freehand` for pressure-sensitive, smooth strokes. Strokes are stored as custom nodes containing an SVG path so they live in the React Flow coordinate space and move with pan/zoom.

**Details:**
- When `activeTool = 'draw'`:
  - Canvas pan is disabled (`panOnDrag=false`)
  - Pointer-down on canvas → begins a stroke
  - Pointer-move → `perfect-freehand` `getStroke()` generates points in real time
  - Pointer-up → stroke committed as a `drawing` node at the bounding box position
  - `getStroke` options: `size: 4`, `thinning: 0.5`, `smoothing: 0.5`, `streamline: 0.5`
  - Points stored in flow coordinates (converted via `screenToFlowPosition` on each event)
  - Stroke SVG rendered inside the node via `getSvgPathFromStroke()` helper
  - Stroke color from active color picker in toolbar (default black)
  - Stroke width controlled by tool size setting (S/M/L)
  - Drawing nodes are not connectable; no handles
  - Strokes can be moved when `activeTool = 'select'`

**Flow:**
```
activeTool = 'draw'
  → onPointerDown(canvas) → currentStroke = [startPoint]
  → onPointerMove → currentStroke.push(point) → rerender live preview SVG
  → onPointerUp → addNode({ type: 'drawing', data: { points, color, size } })
                → currentStroke = []
```

**Use-case:**  
User wants to circle a group of nodes to indicate they belong together — draws a loose oval around them.

---

### F-08 — Node Toolbar (Contextual)

**Priority:** P0  
**Est. Time:** 1 day  
**Risk:** Low

**Description:**  
A floating mini-toolbar that appears above a node when it is selected. Provides the most common per-node actions without opening a side panel.

**Details:**
- Rendered using React Flow's `NodeToolbar` component (positioned via `toolbarPosition`)
- Appears on `onNodeClick` when `activeTool = 'select'`
- Disappears on `onPaneClick` or when selection is cleared
- Contents vary by node type:

| Node Type | Toolbar Actions |
|---|---|
| `sticky` | Color picker (5 presets) · Font size S/M/L · Duplicate · Delete |
| `textbox` | Bold · Italic · Strikethrough · Font size · Delete |
| `drawing` | Color (stroke recolor) · Delete |
| Any | Lock (toggle `draggable=false`) · Copy · Delete |

- Delete button calls `deleteElements`; no confirm (Undo available)
- Duplicate creates a new node offset by `{ x: +20, y: +20 }`
- Lock icon toggles `node.draggable` via `updateNode`
- Toolbar is `nodrag nopan` so clicking it doesn't accidentally drag the node

**Flow:**
```
onNodeClick(node) + activeTool='select'
  → setSelectedNodeId(node.id)
  → NodeToolbar visible={node.id === selectedNodeId}
  → User clicks "Delete" → deleteElements({ nodes: [node] })
```

**Use-case:**  
User clicks a yellow sticky → toolbar appears → changes color to blue → closes automatically when clicking elsewhere.

---

### F-09 — Undo / Redo

**Priority:** P1  
**Est. Time:** 1 day  
**Risk:** Medium — must snapshot before every mutation

**Description:**  
Full undo/redo stack for all canvas mutations: node add, node delete, move, text edit, stroke add, stroke delete.

**Details:**
- History stack: `{ past: Snapshot[], future: Snapshot[] }`
- `Snapshot = { nodes: Node[], edges: Edge[] }`
- Push to `past` before every `setNodes` / `setEdges` call
- `Ctrl/Cmd+Z` → pop from `past`, push current to `future`, apply popped snapshot
- `Ctrl/Cmd+Shift+Z` (or `Ctrl+Y`) → pop from `future`, push current to `past`, apply
- Max stack depth: 50 (older snapshots dropped)
- Freehand strokes count as a single undo step per stroke (not per point)
- Text edits: debounced snapshot on blur, not per keystroke

**Flow:**
```
Before any mutation → pushSnapshot(currentNodes, currentEdges)
User presses Ctrl+Z → applySnapshot(past.pop()) + future.push(current)
User presses Ctrl+Shift+Z → applySnapshot(future.pop()) + past.push(current)
```

**Use-case:**  
User accidentally deletes 5 nodes — presses Ctrl+Z five times to restore them one by one.

---

### F-10 — Keyboard Shortcuts

**Priority:** P1  
**Est. Time:** 0.5 day  
**Risk:** Low

**Description:**  
Keyboard shortcuts for all major actions, discoverable via a help overlay.

| Shortcut | Action |
|---|---|
| `V` | Select tool |
| `S` | Sticky Note tool |
| `T` | Text Box tool |
| `C` | Connector tool |
| `E` | Eraser tool |
| `P` | Freehand draw (pen) |
| `Ctrl/Cmd+Z` | Undo |
| `Ctrl/Cmd+Shift+Z` | Redo |
| `Ctrl/Cmd+A` | Select all |
| `Delete` / `Backspace` | Delete selected |
| `Ctrl/Cmd+D` | Duplicate selected |
| `Ctrl/Cmd+C` / `V` | Copy / Paste nodes |
| `Space` (hold) | Temporarily switch to pan (hand tool) |
| `Ctrl/Cmd+Shift+F` | Fit view |
| `?` | Toggle shortcuts help overlay |

**Flow:**
```
useKeyboardShortcuts() called inside CanvasInner
  → useEffect → window.addEventListener('keydown', handler)
  → handler guards: skip if target is INPUT / TEXTAREA / contentEditable
  → dispatches to setActiveTool / deleteElements / setNodes / setEdges
```

---

### F-11 — Mini Map + Zoom Controls

**Priority:** P1  
**Est. Time:** 0.25 day  
**Risk:** Low

**Description:**  
Bottom-right corner: React Flow's built-in `<MiniMap>` and `<Controls>` with custom styling to match the minimal aesthetic.

**Details:**
- MiniMap: 160×120px, rounded corners, subtle border, node color reflects node type
- Visibility controlled by `useMinimapVisibility()` hook — fades in on viewport move, fades out 1.5s after stop ✅ done
- Controls: zoom-in, zoom-out, fit-view buttons
- Keyboard: `Ctrl/Cmd+Shift+F` triggers `fitView()` (handled in `useKeyboardShortcuts`)

---

### F-12 — Export

**Priority:** P2  
**Est. Time:** 1.5 days  
**Risk:** Medium — SVG/PNG export with freehand strokes needs careful bounds calculation

**Description:**  
Export the current canvas as PNG or as a JSON snapshot for reimport.

**Details:**
- **PNG export:** use `html-to-image` or `dom-to-image-more` on the React Flow viewport element; include background
- **JSON export:** serialize `{ nodes, edges, viewport }` → download as `.mindmap.json`
- **JSON import:** file picker → parse → `setNodes` / `setEdges` / `setViewport`
- Export button lives in a top-right corner toolbar (separate from the left sidebar)
- Canvas title (top-left, editable inline) is included as metadata in the JSON

---

### F-13 — Canvas Persistence (localStorage)

**Priority:** P1
**Est. Time:** 0.5 day
**Risk:** Low

**Description:**  
Auto-saves to `localStorage` on every change, debounced 500ms. Restores on page load.

**Details:**
- Key: `mindmap_v1`
- Saved: `{ nodes, edges, viewport, title, updatedAt }`
- On load: read key → if present, `setNodes`, `setEdges`, `setViewport`
- "Last saved X seconds ago" indicator in top bar
- "Clear canvas" button clears localStorage and resets to empty canvas

---

## 4. Non-Functional Requirements

### NF-01 — Performance
- Canvas must stay ≥60fps at 200 nodes and 50 freehand strokes
- Freehand rendering uses `React.memo` on the drawing node; point arrays are not recalculated unless data changes
- `useNodesState` / `useEdgesState` are the only sources of truth; no derived state re-computed on every frame
- React Flow's internal virtualization handles off-screen nodes

### NF-02 — Responsiveness
- Minimum supported viewport: 768px wide (tablet landscape)
- Left toolbar collapses to icon-only below 1024px
- Not designed for mobile/touch (freehand touch support is a future consideration)

### NF-03 — Accessibility
- All toolbar buttons have `aria-label` and keyboard focus styles
- Active tool is announced via `aria-live` region
- `?` shortcut opens a keyboard shortcut overlay readable by screen readers
- Color choices for sticky notes include non-color visual differentiation (future: pattern fills)

### NF-04 — Bundle Size
- `perfect-freehand` is ~8kb gzipped — acceptable
- `@xyflow/react` is ~120kb gzipped — already in the project
- Avoid heavy libraries (no Slate.js, no full-fat rich text editors) — use native `contentEditable`

### NF-05 — Error Resilience
- Malformed localStorage JSON → catch, clear key, start fresh canvas
- React Flow `onError` handler logs errors to console; no crashes to user
- Empty undo stack → Ctrl+Z is a no-op (no error)

---

## 5. Implementation Plan

### Phase 1 — Core Canvas (P0) · ~5 days

```
Day 1:   Left Toolbar (F-01) + Select Tool (F-02) + activeTool context ( Done )
Day 2:   Sticky Note Node (F-03) — placement, edit, resize ( Done )
Day 3:   Text Box Node (F-04) — placement, edit, formatting ( Done )
Day 4:   Node Toolbar (F-08) — per-type actions, color picker, delete, duplicate ( Done )
Day 5:   Eraser Tool (F-06) — node eraser + drawing node eraser ( Done )
```

### Phase 2 — Drawing & Connections (P0/P1) · ~3.5 days

```
Day 6:   Freehand Draw (F-07) — perfect-freehand integration, SVG node, live preview ( Done )
Day 7:   Connector Tool (F-05) — handle visibility, edge creation, label edit ( Done )
Day 7.5: Undo/Redo (F-09) — history stack, keyboard bindings
```

### Phase 3 — Polish (P1/P2) · ~2 days

```
Day 8:   Keyboard Shortcuts (F-10) + Minimap/Controls (F-11) + Persistence (F-13)
Day 9:   Export PNG + JSON (F-12) + visual polish pass
```

---

## 6. File Structure

The guiding rule: **`MindMapCanvas.tsx` is a composition root only** — it imports and assembles, never holds state or logic directly. Every distinct concern lives in its own file.

```
src/components/mind-map/
  context/
    ToolContext.tsx              ← Tool type union, ToolProvider, useTool()

  hooks/
    useKeyboardShortcuts.ts     ← All keydown bindings (tool switch, delete, select-all, undo/redo, fit-view) ✅
    useEraser.ts                ← Eraser: drag-erase, cursor style injection, node handlers — returns { isEraserActive, eraserPos, handlers } ✅
    useMinimapVisibility.ts     ← Show minimap on viewport move, hide 1.5s after stop (planned)
    useHistory.ts               ← Undo/redo snapshot stack — push/pop nodes+edges (F-09, planned)
    usePersistence.ts           ← localStorage debounced auto-save + restore on mount (F-13, planned)

  constants/
    initialData.ts              ← INITIAL_NODES, INITIAL_EDGES (demo content, swapped out once persistence lands) ✅

  canvas/
    MindMapCanvas.tsx           ← Composition root: wraps ToolProvider + layout skeleton, calls tool hooks, wires handlers ✅
    Toolbar.tsx                 ← Left floating tool buttons (reads/sets activeTool via useTool) ✅
    EraserCursor.tsx            ← Dumb display: fixed circle div tracking pointer when eraser active ✅
    TopBar.tsx                  ← Header bar: canvas title (editable) + ActiveToolBadge + export actions (planned)

  nodes/
    StickyNode.tsx              ← Sticky note: contentEditable body, color, resize (F-03) ✅
    TextBoxNode.tsx             ← Transparent text label: formatting, auto-delete if empty (F-04) ✅
    DrawingNode.tsx             ← Freehand stroke rendered as SVG path (F-07, planned)
    nodeTypes.ts                ← { sticky, textbox } map passed to <ReactFlow> ✅

  edges/
    LabeledEdge.tsx             ← Smoothstep edge with inline-editable label via EdgeLabelRenderer (F-05, planned)
    edgeTypes.ts                ← { labeled } map passed to <ReactFlow> (planned)

  toolbar/
    NodeToolbar.tsx             ← Contextual floating toolbar shown when a node is selected (F-08) ✅
    NodeToolbarActions.tsx      ← Per-type action sets: color picker, bold/italic, duplicate, lock, delete (planned)

src/app/mind-map/
  page.tsx                      ← Renders <MindMapCanvas /> — nothing else ✅
```

### Responsibility boundaries

| File | Allowed to… | Must NOT… |
|---|---|---|
| `MindMapCanvas.tsx` | Import/arrange components, call tool hooks, wire returned handlers | Own tool logic directly; call `useEffect` for tool concerns |
| `hooks/use*.ts` | Own isolated state + side effects for one concern; call `useReactFlow` | Import from other hooks (keep them flat) |
| `nodes/*.tsx` | Render node UI, read `data`, call `useReactFlow` for self-updates | Reach into global canvas state directly |
| `Toolbar.tsx` | Call `useTool()`, render buttons | Know anything about nodes or edges |

---

## 7. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Freehand perf degrades at long strokes | Medium | High | Cap points array at 2000; simplify with RDP algorithm on commit |
| Undo stack grows too large | Low | Medium | Cap at 50 snapshots; serialize only node IDs + positions for moves |
| Eraser hit-testing is imprecise | Medium | Medium | Use a 20px radius tolerance; test on dense canvases |
| `contentEditable` text sync bugs | Medium | Medium | Use `onBlur` only (not `onInput`) to commit; keep React out of edit mode |
| localStorage quota exceeded (large drawings) | Low | Low | Compress drawing points; evict oldest snapshot if quota error |
| TypeScript errors with React Flow node generics | Low | Low | Define explicit node union type; use `satisfies` pattern |
