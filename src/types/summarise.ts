export interface ShotData {
  shotNumber: number;
  storyboardUrl?: string;
  description: string;
  shootingStyle: string;
  cameraAngle: string;
  script: string[];
}

export interface ConceptMeta {
  concept: string;
  tone: string;
  targetAudience: string;
  projectName: string;
}

export type SummariseLoadState = "loading" | "ready" | "error";
