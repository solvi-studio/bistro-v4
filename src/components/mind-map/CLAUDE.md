# Mind-Map Component

React Flow canvas for building scene-based TikTok content plans. Sits at `/mind-map` route (also embedded in `/creative`), keyed by `?script=` param.

---

## Node types (exactly 3)

| RF key | Component | File | Editable |
|---|---|---|---|
| `scene` | `SceneNode` | `nodes/SceneNode.tsx` | Label: read-only (auto-numbered). No color/style controls. |
| `content` | `ContentNode` | `nodes/ContentNode.tsx` | Header: fixed. Body: double-click → `contentEditable`. Font size via toolbar. |
| `videoDrop` | `VideoNode` | `nodes/VideoNode.tsx` | Form inputs (URL + prompt). Status: `idle\|analyzing\|done\|error`. |

**Do not add new node types** without updating `nodes/nodeTypes.ts`, `utils/spawnTopic.ts`, `utils/mindmap-export.ts`, and `MindMapCanvas.onDrop`.

### ContentNode data shape
```ts
{ category: "visual" | "audio" | "script", header: string, body: string, fontSize: number }
```
- `header` is set at creation and never changed — it's the menu option or sidebar chip label.
- `category` drives the color theme from `CATEGORY_THEME` in `constants/topics.ts`.

### VideoNode (RF type key `"videoDrop"`)
- Component renamed from `VideoDropNode` but **RF type key stays `"videoDrop"`** so saved canvases load correctly.
- Analysis results spawn themed `content` nodes: `composition→visual`, `toneAndMood→audio`, `bigPicture+targetAudience→script`.
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
   - `useNodeDragConnect.onNodeDragStop()` — `wouldBreakChain()` guard

2. **scene→content/video**: `labeled` edge, arrow always points **outward from scene**. Source is always the scene regardless of drag direction. Enforced in:
   - `SceneNode.addContentNode()` / `addVideoAnalysis()` — hardcoded direction
   - `MindMapCanvas.onConnect()` — swaps if scene is target
   - `useNodeDragConnect` — `normalizeSceneEdge()` swaps to scene-as-source

3. **content/video↔content/video**: `labeled` edge, direction follows drag. No extra constraints.

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

- **Click** chip → `spawnContentNode({ addNodes }, group.category, label)` — places at default position.
- **Drag** chip → sets `TOPIC_DND_MIME` with `{ category, header }` payload → `MindMapCanvas.onDrop` calls `spawnContentNode` at cursor.
- **Drag** Video Analysis card → sets `VIDEO_DND_MIME` → spawns `videoDrop` node at cursor.

---

## Key shared utilities

| File | Purpose |
|---|---|
| `utils/mind-map-handles.ts` | `pickHandles(src, tgt)` — returns closest facing `sourceHandle`/`targetHandle` based on node centers. Used by edges (live) and drag-connect. |
| `utils/mind-map-store.ts` | `loadCanvas(mapId)` / `saveCanvas(mapId, {nodes, edges, viewport})` — localStorage keyed by script id or `"default"`. |
| `utils/mindmap-export.ts` | `exportMindMapGraph()` — walks scene chain order, groups content nodes under scenes. Content nodes export as `header: body`. |
| `utils/mind-map-layout.ts` | `distributeBesideHub()` / `rectOf()` — collision-free layout for video result leaves. |
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
