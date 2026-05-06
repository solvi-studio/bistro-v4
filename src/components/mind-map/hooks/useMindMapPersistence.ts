"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Node, Edge, Viewport } from "@xyflow/react";
import { MindMapFile } from "@/components/mind-map/types/mindmap-schema";
import {
  buildMindMapFile,
  isValidMindMapFile,
  migrate,
  restoreNodes,
  restoreEdges,
} from "@/components/mind-map/lib/mindmap-serializer";
import { readMap, writeMap } from "@/components/mind-map/lib/mindmap-storage";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseMindMapPersistenceProps {
  mapId: string;
  mapName: string;
  nodes: Node[];
  edges: Edge[];
  getViewport: () => Viewport;
  onImport: (nodes: Node[], edges: Edge[], viewport: Viewport) => void;
  createdAt: string;
}

interface UseMindMapPersistenceReturn {
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  errorMessage: string | null;
  exportToFile: () => void;
  importFromFile: (file: File) => Promise<void>;
}

const DEBOUNCE_MS = 1500;
const SAVED_RESET_MS = 2000;

export function useMindMapPersistence({
  mapId,
  mapName,
  nodes,
  edges,
  getViewport,
  onImport,
  createdAt,
}: UseMindMapPersistenceProps): UseMindMapPersistenceReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  // Keep refs current so the debounced callback sees latest state
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const doSave = useCallback(() => {
    setSaveStatus("saving");
    try {
      const file = buildMindMapFile(
        mapId,
        mapName,
        nodesRef.current,
        edgesRef.current,
        getViewport(),
        createdAt
      );
      writeMap(file);
      setLastSavedAt(new Date());
      setErrorMessage(null);
      setSaveStatus("saved");
      if (savedResetRef.current) clearTimeout(savedResetRef.current);
      savedResetRef.current = setTimeout(() => setSaveStatus("idle"), SAVED_RESET_MS);
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "QuotaExceededError"
          ? "Storage full — export your map to free space."
          : "Auto-save failed.";
      setErrorMessage(msg);
      setSaveStatus("error");
    }
  }, [mapId, mapName, getViewport, createdAt]);

  // Debounced auto-save on nodes/edges change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doSave, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nodes, edges, doSave]);

  // Cleanup saved-reset timer on unmount
  useEffect(() => {
    return () => {
      if (savedResetRef.current) clearTimeout(savedResetRef.current);
    };
  }, []);

  const exportToFile = useCallback(() => {
    const file = buildMindMapFile(mapId, mapName, nodes, edges, getViewport(), createdAt);
    const json = JSON.stringify(file, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mapName.replace(/\s+/g, "-").toLowerCase()}.mindmap.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [mapId, mapName, nodes, edges, getViewport, createdAt]);

  const importFromFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const raw: unknown = JSON.parse(text);
        if (!isValidMindMapFile(raw)) throw new Error("Invalid file format.");
        const data = migrate(raw);
        const restoredNodes = restoreNodes(data.nodes);
        const restoredEdges = restoreEdges(data.edges);
        onImport(restoredNodes, restoredEdges, data.viewport);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Import failed.";
        setErrorMessage(msg);
        setSaveStatus("error");
      }
    },
    [onImport]
  );

  return { saveStatus, lastSavedAt, errorMessage, exportToFile, importFromFile };
}

// ─── Load initial state from storage ─────────────────────────────────────────

export function loadSavedMap(mapId: string): MindMapFile | null {
  return readMap(mapId);
}
