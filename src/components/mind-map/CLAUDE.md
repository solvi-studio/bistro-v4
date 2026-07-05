# Mind-Map Component

React Flow canvas for building scene-based TikTok content plans. Sits at `/mind-map` route (also embedded in `/creative`), keyed by `?script=` param.

---

## Node types (exactly 3)

| RF key | Component | File | Editable |
|---|---|---|---|
| `scene` | `SceneNode` | `nodes/SceneNode.tsx` | Label: read-only (auto-numbered). No color/style controls. |
| `content` | `ContentNode` | `nodes/ContentNode.tsx` | Header: fixed. Body: double-click → `contentEditable`. Font size via toolbar. |
| `videoDrop` | `VideoNode` | `nodes/VideoNode.tsx` | TikTok URL + analysis-type chips (required ≥1, grouped visual/audio/script) + start/end time window (default 0–30 s). Status: `idle\|analyzing\|done\|error`. |

**Do not add new node types** without updating `nodes/nodeTypes.ts`, `utils/spawnTopic.ts`, `utils/mindmap-export.ts`, and `MindMapCanvas.onDrop`.

### ContentNode data shape
```ts
{
  category: "visual" | "audio" | "script",
  header: string,
  body: string,
  fontSize: number,
  width?: number,      // fixed card width (user-resizable via corner drag)
  minHeight?: number,  // auto-grow floor: card grows taller when text overflows, never shrinks below this
}
```
- `header` is set at creation and never changed — it's the menu option or sidebar chip label.
- `category` drives the color theme from `CATEGORY_THEME` in `constants/topics.ts`.
- `width` / `minHeight` default to 200 / 64 in the component when absent (legacy saved nodes safe).
- Node carries **no node-level `height`** — React Flow auto-measures so collision box always matches the rendered card.

### VideoNode (RF type key `"videoDrop"`)
- Component renamed from `VideoDropNode` but **RF type key stays `"videoDrop"`** so saved canvases load correctly.
- Analysis results spawn themed `content` nodes typed by the 6 BE analysis types (`scene_description`, `shooting_style` → visual; `voiceover`, `music`, `sound_effect` → audio; `concept_writing` → script). Mapping lives in `TYPE_TO_CONTENT` in `constants/topics.ts`.
- De-dupes by `header::body` key against nodes prefixed `vid-{id}-`.

---

## Edge types (exactly 2)

| RF key | Component | Visual | When used |
|---|---|---|---|
| `labeled` | `LabeledEdge` | Gray, smoothstep, optional arrow | All connections except scene→scene chain |
| `sceneEdge` | `SceneEdge` | Amber dashed, no label | scene→scene sequential chain only |

### Dynamic handle routing (`LabeledEdge`)
`LabeledEdge` uses `useInternalNode(source/target)` + `pickHandles()` on every render — the edge always exits/enters the **closest facing side** based on current node positions. Stored `sourceHandle`/`targetHandle` on the edge object are ignored at render time.

`SceneEdge` is always `bottom→top` (scenes stack vertically), so it doesn't need dynamic routing.

---

## Connection rules

1. **scene→scene**: `sceneEdge`. **Linear only** — each scene has at most 1 successor and 1 predecessor. Enforced in:
   - `SceneNode.addScene()` — won't add if node already has outgoing sceneEdge
   - `MindMapCanvas.onConnect()` — rejects if chain would branch

   Dragging one scene onto another (or onto content/video) creates **no** edge — scene drags are pure repositioning (spec §Drag behavior). Scene chaining only happens via the "+" toolbar or the connector tool.

2. **scene→content/video**: `labeled` edge, arrow always points **outward from scene**. Source is always the scene regardless of drag direction. Enforced in:
   - `SceneNode.addContentNode()` / `addVideoAnalysis()` — hardcoded direction
   - `MindMapCanvas.onConnect()` — swaps if scene is target
   - `useNodeDragConnect` — `normalizeSceneEdge()` swaps to scene-as-source

   **Drag-to-link proximity model** (`useNodeDragConnect` + `utils/sceneProximity.ts`): perimeters are **proportional to each scene's measured size**, not fixed pixels — `sceneRadius = ½ · (scene's bounding-box diagonal)`, scaled by `DETECT_MULT` (3.25) for the outer guidance perimeter and `CONNECT_MULT` (1.5) for the inner link perimeter. While dragging a `content`/`videoDrop` node, the nearest scene whose detect perimeter contains the block shows the connect-zone overlay (`canvas/SceneConnectionOverlay.tsx` — dashed box + "Drop to connect to Scene N" label + proximity glow tinted to the block's color); the visible box footprint tracks that scene's connect perimeter diameter, so it grows/shrinks as the scene is resized. The block links on drop if **any corner** of its bounding box (not just its center) falls within the connect radius — more sensitive for large or off-center drags; outside that it's guidance-only.

   The legacy bounding-box-intersection body-overlap drag-connect mechanism (`.mm-drop-target` outline, `getIntersectingNodes`) has been **removed entirely**, for every node type — this proximity model is now the only drag-based way to link content/video to a scene.

3. **content/video↔content/video**: `labeled` edge, direction follows drag via the connector tool (handle-drag) — body-overlap dragging no longer links anything. **Content nodes cannot connect to other content nodes** — enforced in `MindMapCanvas.isValidConnection` (rejects a connection when both endpoints are type `content`). Video nodes are unrestricted: video↔video and content↔video connect normally.

---

## Scene "+" cursor menu

Appears on hover/select below each `SceneNode`. Items in order:

| Position | Action | Behaviour |
|---|---|---|
| 1 | Scene (Clapperboard) | `addScene()` — does nothing if this scene already has a successor |
| 2 | Visual (Image) | Submenu → `categoryOptions("visual")` items |
| 3 | Audio (Headphones) | Submenu → `categoryOptions("audio")` items |
| 4 | Script (ClipboardEdit) | Submenu → `categoryOptions("script")` items |
| 5 | Video Analysis (BarChart2) | `addVideoAnalysis()` — spawns `videoDrop` node right of scene |

Submenu options come from `categoryOptions(category)` in `constants/topics.ts` — single source of truth shared with the sidebar. To change the option list, edit `MIND_MAP_GROUPS[].sections[].items` only.

---

## Sidebar (`MindMapSidePanel`)

Renders groups from `MIND_MAP_GROUPS` where `!fromScript`. Groups with `category` field → Visual / Audio / Script chips.

- **Click** chip → `spawnContentNode({ addNodes, getNodes }, group.category, label)` — finds first free slot near the default anchor (collision-aware).
- **Drag** chip → sets `TOPIC_DND_MIME` with `{ category, header }` payload → `MindMapCanvas.onDrop` calls `spawnContentNode` at cursor; nudges to nearest free slot if the cursor lands on an existing node.
- **Drag** Video Analysis card → sets `VIDEO_DND_MIME` → spawns `videoDrop` node; also nudges on overlap.

---

## Key shared utilities

| File | Purpose |
|---|---|
| `utils/mind-map-handles.ts` | `pickHandles(src, tgt)` — returns closest facing `sourceHandle`/`targetHandle` based on node centers. Used by edges (live) and drag-connect. `centerOf(node)` / `sizeOf(node)` — node center/size, reused by proximity math. |
| `utils/sceneProximity.ts` | `sceneRadius(w, h)` — per-scene base perimeter (½ diagonal); `DETECT_MULT` (3.25) / `CONNECT_MULT` (1.7) scale it into the two perimeters. `activeSceneZone(blockCenter, scenes)` — nearest scene within its own detect radius + Voronoi-relative eased `glow` (0..1) + that scene's `connectRadius`. Drives `canvas/SceneConnectionOverlay.tsx` and the drop-linking check in `useNodeDragConnect`. |
| `utils/mind-map-store.ts` | `loadCanvas(mapId)` / `saveCanvas(mapId, {nodes, edges, viewport})` — localStorage keyed by script id or `"default"`. |
| `utils/mindmap-export.ts` | `exportMindMapGraph()` — walks scene chain order, groups content nodes under scenes. Content nodes export as `header: body`. |
| `utils/mind-map-layout.ts` | Collision-free placement. `rectOf(node)` → bounding box (reads `measured → node.width/height → data.width/minHeight → defaults`). `placeNode(occupied, x, y, dir, w, h)` — one-shot free-slot finder + registers rect. `distributeGrid(...)` — batch 2-column grid for video results. `findFreePosition(...)` — underlying spiral search (10 cols × 24 rows, GAP=28). |
| `constants/topics.ts` | `MIND_MAP_GROUPS`, `CATEGORY_THEME`, `categoryOptions(category)`, `ANCHOR_NODE_IDS`. Single source for all category/color data. |

---

## Persistence

Canvas saves to localStorage via `saveCanvas(mapId, ...)`, debounced 400ms. Viewport also saved on pan end. Restored on mount after `restored.current = true` so defaults are never written over saved data.

Scene labels are auto-renumbered by a `useEffect` in `MindMapCanvas` that walks the sceneEdge chain and updates `data.label` whenever nodes/edges change. Idempotent — only calls `setNodes` if a label is actually wrong.

---

## Tools & keyboard shortcuts

| Key | Tool | Cursor |
|---|---|---|
| `v` | select | default |
| `c` | connector | crosshair |
| `e` | eraser | none (custom SVG cursor) |
| `b` | video | crosshair |
| `Delete`/`Backspace` | delete selected | — |
| `Cmd/Ctrl+A` | select all (non-anchor) | — |

`ANCHOR_NODE_IDS` (`constants/topics.ts`) lists node IDs that can never be deleted or erased. Currently: `"idea"` (the initial Scene 1).

---

## What was removed (don't re-add)

`TopicNode`, `StickyNode`, `TextBoxNode`, `ShapeNode`, `VideoDropNode`, `QuickConnectArrows`, `Toolbar`, `NodeToolbar`, `utils/nodeColors.ts` — all deleted. The `sticky`, `textbox`, `shape`, `connector`-tool drag shortcuts (`s`, `t`, `n`) are also gone.
