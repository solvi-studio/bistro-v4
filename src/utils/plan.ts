import type { PlanTask } from "@/types/plan";
import type { ConceptMeta, ShotData } from "@/types/summarise";
import { notifyDataChange } from "@/utils/dataSync";

const KEYS = {
  summarise: "bistro_summarise_data",
} as const;

// Plan tasks are scoped per folder (idea/script), like calendar events, so a
// folder's board + scheduled tasks feed that folder on the global calendar.
const TASKS_PREFIX = "bistro_plan_tasks_";
const LEGACY_TASKS_KEY = "bistro_plan_tasks"; // pre-per-script global key
const tasksKey = (scriptId: string) => `${TASKS_PREFIX}${scriptId}`;

const SEED_META: ConceptMeta = {
  concept:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim.",
  tone: "Warm, soft & visually appealing",
  targetAudience: "Lifestyle GenZ",
  projectName: "Stargazing",
};

const SEED_SHOTS: ShotData[] = [
  {
    shotNumber: 1,
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
    shootingStyle: "Wide shot",
    cameraAngle: "Wide shot",
    script: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
      "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      "Ut enim ad minim veniam, quis nostrud exercitation.",
    ],
  },
  {
    shotNumber: 2,
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
    shootingStyle: "Wide shot",
    cameraAngle: "Wide shot",
    script: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
      "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      "Ut enim ad minim veniam, quis nostrud exercitation.",
    ],
  },
  {
    shotNumber: 3,
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
    shootingStyle: "Wide shot",
    cameraAngle: "Wide shot",
    script: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
      "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      "Ut enim ad minim veniam, quis nostrud exercitation.",
    ],
  },
  {
    shotNumber: 4,
    description:
      "Camera follows subject through narrow trail at golden hour. Warm bokeh fills the background as subject pauses to look at the sky. Motion is slow and deliberate.",
    shootingStyle: "Tracking shot",
    cameraAngle: "Eye level",
    script: [
      "Follow subject from behind at a steady walking pace.",
      "Slow pull focus from subject to distant mountains.",
      "Hold on subject as they stop and look upward.",
    ],
  },
  {
    shotNumber: 5,
    description:
      "Extreme close-up of hands setting up telescope equipment. Detail-driven shot establishing the preparation ritual before the main stargazing event begins.",
    shootingStyle: "Close-up",
    cameraAngle: "Top-down / Bird's eye",
    script: [
      "Start tight on hands unboxing the telescope lens.",
      "Slow tilt up to reveal the full setup on the blanket.",
      "Cut on action as subject peers through the eyepiece.",
    ],
  },
  {
    shotNumber: 6,
    description:
      "Low angle looking up at subject silhouetted against a star-filled sky. Milky Way visible in the frame. Long exposure quality with slight lens flare from torch.",
    shootingStyle: "Long exposure style",
    cameraAngle: "Low angle",
    script: [
      "Position camera at ground level, lens pointing up.",
      "Subject stands motionless for dramatic silhouette.",
      "Gentle fade-in transition from black.",
    ],
  },
  {
    shotNumber: 7,
    description:
      "Over-the-shoulder shot of subject sketching or journaling in the dark with a small headlamp. Captures the intimate, quiet atmosphere of the night.",
    shootingStyle: "Over-the-shoulder",
    cameraAngle: "Medium shot",
    script: [
      "Frame over right shoulder with journal in foreground.",
      "Soft ambient sound — wind, crickets — no voiceover.",
      "Cut to close-up of pen moving across the page.",
    ],
  },
  {
    shotNumber: 8,
    description:
      "Time-lapse of stars rotating overhead with tent and subject in foreground. Cinematic final sequence that gives sense of scale and passage of time across the night.",
    shootingStyle: "Time-lapse",
    cameraAngle: "Wide angle / Ultra-wide",
    script: [
      "Lock off camera on tripod with 14mm or wider lens.",
      "Capture minimum 300 frames for smooth 10s clip.",
      "Subject stays still or enters frame slowly at midpoint.",
    ],
  },
];

const SEED_TASKS: PlanTask[] = [
  {
    id: "1",
    text: "Buy digi cam",
    completed: false,
    colorTag: "pink",
    phase: "pre",
  },
  {
    id: "2",
    text: "Bring camping equipment",
    completed: false,
    colorTag: "pink",
    phase: "pre",
  },
  {
    id: "3",
    text: "Film stargazing sequences",
    completed: false,
    colorTag: "blue",
    phase: "production",
  },
  {
    id: "4",
    text: "Edit colour grade",
    completed: false,
    colorTag: "yellow",
    phase: "post",
  },
  {
    id: "5",
    text: "Cut sequences",
    completed: false,
    colorTag: "yellow",
    phase: "post",
  },
  {
    id: "6",
    text: "Add sound effects",
    completed: false,
    colorTag: "yellow",
    phase: "post",
  },
  {
    id: "7",
    text: "Change music tone",
    completed: false,
    colorTag: "yellow",
    phase: "post",
  },
];

function safeGet<T>(key: string, seed: T): T {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return seed;
    return JSON.parse(raw) as T;
  } catch {
    return seed;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage quota exceeded — ignore
  }
}

export function getPlanTasks(scriptId: string): PlanTask[] {
  let raw = safeGet<PlanTask[] | null>(tasksKey(scriptId), null);
  // One-time migration: surface pre-per-script global tasks on the default plan.
  if (raw === null && scriptId === "default") {
    raw = safeGet<PlanTask[] | null>(LEGACY_TASKS_KEY, null);
  }
  // Empty board by default — the user generates the template via the project
  // button. Normalize tasks saved before `phase` existed so old data still slots
  // into a column instead of vanishing.
  return (raw ?? []).map((t) => ({ ...t, phase: t.phase ?? "pre" }));
}

// Fresh copy of the default task template (unique ids), generated on demand
// from the plan page's project button.
export function getDefaultPlanTasks(): PlanTask[] {
  return SEED_TASKS.map((t, i) => ({ ...t, id: `seed-${Date.now()}-${i}` }));
}

export function savePlanTasks(scriptId: string, tasks: PlanTask[]): void {
  safeSet(tasksKey(scriptId), tasks);
  // Scheduled-task dates feed the shared calendar — notify other views.
  notifyDataChange();
}

export function getSummariseData(): { meta: ConceptMeta; shots: ShotData[] } {
  return safeGet(KEYS.summarise, { meta: SEED_META, shots: SEED_SHOTS });
}

export function saveSummariseData(data: {
  meta: ConceptMeta;
  shots: ShotData[];
}): void {
  safeSet(KEYS.summarise, data);
}
