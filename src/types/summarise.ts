export interface ShotData {
  shotNumber: number;
  time?: string;
  description: string;
  shootingStyle: string;
  audio: string;
  script: string[];
}

export interface ConceptMeta {
  projectName: string;
}

export type SummariseLoadState = "loading" | "ready" | "error";

export interface SummariseResult {
  meta: ConceptMeta;
  shots: ShotData[];
}
