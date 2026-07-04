import type { EdgeTypes } from "@xyflow/react";
import LabeledEdge, {
  EDGE_MARKER,
} from "@/components/mind-map/edges/LabeledEdge";
import SceneEdge from "@/components/mind-map/edges/SceneEdge";

export { EDGE_MARKER };

export const edgeTypes: EdgeTypes = {
  labeled: LabeledEdge,
  sceneEdge: SceneEdge,
};
