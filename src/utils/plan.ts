import type { CalendarEvent, PlanTask } from "@/types/plan";
import type { ConceptMeta, ShotData } from "@/types/summarise";

const KEYS = {
  tasks: "bistro_plan_tasks",
  events: "bistro_plan_events",
  summarise: "bistro_summarise_data",
} as const;

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
    text: "Go to Blue Mountains",
    scheduledDate: undefined,
    completed: false,
    colorTag: "pink",
  },
  {
    id: "2",
    text: "Bring your digi cam and camping equipment",
    scheduledDate: undefined,
    completed: false,
    colorTag: "blue",
  },
  {
    id: "3",
    text: "Film stargazing sequences",
    scheduledDate: undefined,
    completed: false,
    colorTag: "blue",
  },
  {
    id: "4",
    text: "Edit your film and colour grade",
    scheduledDate: undefined,
    completed: false,
    colorTag: "yellow",
  },
];

const SEED_EVENTS: CalendarEvent[] = [
  {
    id: "1",
    date: new Date().toISOString().split("T")[0],
    title: "Editing",
    notes: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
      "sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      "Ut enim ad minim veniam, quis nostrud exercitation.",
    ],
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

export function getPlanTasks(): PlanTask[] {
  return safeGet(KEYS.tasks, SEED_TASKS);
}

export function savePlanTasks(tasks: PlanTask[]): void {
  safeSet(KEYS.tasks, tasks);
}

export function getCalendarEvents(): CalendarEvent[] {
  return safeGet(KEYS.events, SEED_EVENTS);
}

export function saveCalendarEvents(events: CalendarEvent[]): void {
  safeSet(KEYS.events, events);
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
