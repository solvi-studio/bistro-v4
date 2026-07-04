"use client";

// https://n1ghtmare.github.io/2022-01-14/implement-a-keyboard-shortcuts-handler-in-typescript/

import type { Edge, Node } from "@xyflow/react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { ANCHOR_NODE_IDS } from "@/components/mind-map/constants/topics";
import type { Tool } from "@/components/mind-map/context/ToolContext";

// ─── Trie types ───────────────────────────────────────────────────────────────

type HotkeyNode = {
  children: Map<string, HotkeyNode>;
  callback?: (e: KeyboardEvent) => void;
};

type HotkeyScope = {
  root: HotkeyNode;
  currentNode: HotkeyNode;
};

// ─── Module-level singletons ──────────────────────────────────────────────────

const scopes = new Map<string, HotkeyScope>();
let currentScopeName = "global";
const activeKeys = new Set<string>();
let listenerRefCount = 0;

// ─── Key normalisation ────────────────────────────────────────────────────────

function normalizeKey(key: string): string {
  switch (key.trim().toLowerCase()) {
    case "esc":
      return "escape";
    case "ctrl":
      return "control";
    case "cmd":
    case "meta":
      return "meta";
    case "option":
      return "alt";
    case "del":
      return "delete";
    default:
      return key.trim().toLowerCase();
  }
}

function parsePattern(pattern: string): string[] {
  return pattern
    .trim()
    .split(/\s+/)
    .map((step) => step.split("+").map(normalizeKey).sort().join("+"));
}

// ─── Scope helpers ────────────────────────────────────────────────────────────

function makeNode(): HotkeyNode {
  return { children: new Map() };
}

function getOrCreateScope(name: string): HotkeyScope {
  if (!scopes.has(name)) {
    const root = makeNode();
    scopes.set(name, { root, currentNode: root });
  }
  return scopes.get(name)!;
}

export function setHotkeysScope(name: string) {
  currentScopeName = name;
}

export function getHotkeysScope() {
  return currentScopeName;
}

// ─── Registration ─────────────────────────────────────────────────────────────

function registerHotkey(
  pattern: string,
  scopeName: string,
  callback: (e: KeyboardEvent) => void,
): () => void {
  const scope = getOrCreateScope(scopeName);
  const steps = parsePattern(pattern);

  let node = scope.root;
  for (const step of steps) {
    if (!node.children.has(step)) {
      node.children.set(step, makeNode());
    }
    node = node.children.get(step)!;
  }

  node.callback = callback;

  return () => {
    node.callback = undefined;
  };
}

// ─── Guard ────────────────────────────────────────────────────────────────────

function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return (
    !!t &&
    (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
  );
}

// ─── Event handlers ───────────────────────────────────────────────────────────

function onKeyDown(e: KeyboardEvent) {
  if (isTyping(e)) return;

  activeKeys.add(normalizeKey(e.key));

  const scope = scopes.get(currentScopeName);
  if (!scope) return;

  const combo = [...activeKeys].sort().join("+");
  const next = scope.currentNode.children.get(combo);

  if (next) {
    scope.currentNode = next;
    if (next.callback) {
      next.callback(e);
      scope.currentNode = scope.root;
    }
  } else {
    scope.currentNode = scope.root;
    const rootMatch = scope.root.children.get(combo);
    if (rootMatch) {
      scope.currentNode = rootMatch;
      if (rootMatch.callback) {
        rootMatch.callback(e);
        scope.currentNode = scope.root;
      }
    }
  }
}

function onKeyUp(e: KeyboardEvent) {
  activeKeys.delete(normalizeKey(e.key));

  if (activeKeys.size === 0) {
    for (const scope of scopes.values()) {
      scope.currentNode = scope.root;
    }
  }
}

// ─── Listener lifecycle ───────────────────────────────────────────────────────

function attachListeners() {
  if (listenerRefCount === 0) {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
  }
  listenerRefCount++;
}

function detachListeners() {
  listenerRefCount--;
  if (listenerRefCount === 0) {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    activeKeys.clear();
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type ShortcutDeps = {
  setActiveTool: (tool: Tool) => void;
  deleteElements: (params: { nodes: Node[]; edges: Edge[] }) => void;
  getNodes: () => Node[];
  getEdges: () => Edge[];
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
};

export function useKeyboardShortcuts(deps: ShortcutDeps) {
  const {
    setActiveTool,
    deleteElements,
    getNodes,
    getEdges,
    setNodes,
    setEdges,
  } = deps;

  useEffect(() => {
    attachListeners();

    const unbinds: Array<() => void> = [];

    function reg(pattern: string, cb: (e: KeyboardEvent) => void) {
      unbinds.push(registerHotkey(pattern, "global", cb));
    }

    // Active tool shortcuts (select, connector, eraser, video)
    reg("v", () => setActiveTool("select"));
    reg("c", () => setActiveTool("connector"));
    reg("e", () => setActiveTool("eraser"));
    reg("b", () => setActiveTool("video"));

    const deleteSelected = () =>
      deleteElements({
        nodes: getNodes().filter(
          (n) => n.selected && !ANCHOR_NODE_IDS.has(n.id),
        ),
        edges: getEdges().filter((e) => e.selected),
      });

    reg("delete", deleteSelected);
    reg("backspace", deleteSelected);

    const selectAll = (e: KeyboardEvent) => {
      e.preventDefault();
      setNodes((ns) =>
        ns.map((n) => ({ ...n, selected: !ANCHOR_NODE_IDS.has(n.id) })),
      );
      setEdges((es) => es.map((ev) => ({ ...ev, selected: true })));
    };

    reg("control+a", selectAll);
    reg("meta+a", selectAll);

    reg("control+z", () => console.log("[shortcut] undo"));
    reg("meta+z", () => console.log("[shortcut] undo"));
    reg("control+shift+z", () => console.log("[shortcut] redo"));
    reg("meta+shift+z", () => console.log("[shortcut] redo"));

    return () => {
      unbinds.forEach((u) => u());
      detachListeners();
    };
  }, [setActiveTool, deleteElements, getNodes, getEdges, setNodes, setEdges]);
}
