// Video analysis service.
//
// TODO(backend): the real analysis backend does not exist yet. When it lands,
// POST the file to the scraper/upload endpoint and stream the result. For now
// this resolves with a mock after a short delay so the drop UX is exercisable.

export type VideoAnalysisStatus = "idle" | "analyzing" | "done" | "error";

export interface VideoAnalysisResult {
  status: "ok";
  fileName: string;
  title: string;
  note: string;
}

export async function analyzeVideo(file: File): Promise<VideoAnalysisResult> {
  // Simulate network + model latency.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    status: "ok",
    fileName: file.name,
    title: file.name.replace(/\.[^.]+$/, ""),
    note: "Analysis stubbed — backend not connected yet.",
  };
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}
