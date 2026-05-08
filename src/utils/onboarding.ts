import { z } from "zod";

// Schema version for migrations
export const SCHEMA_VERSION = 1;

// Zod schemas for validation
export const OnboardingSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  dataLane: z.array(z.string()).min(1, "At least one content lane required"),
  challenge: z.string().min(1, "Challenge is required").max(500, "Challenge too long"),
  tiktokUrl: z.string().max(500).optional(),
});

export type OnboardingData = z.infer<typeof OnboardingSchema>;

export type TutorialStep = {
  id: number;
  title: string;
  content: string;
  imageAsset?: string; // Path to tutorial image asset
  stepType?: "standard" | "tiktok-flow" | "profile-guide"; // Type of tutorial step
  subStep?: string; // For multi-part steps like 3.1, 3.2, 3.3
};

export type TutorialData = {
  steps: TutorialStep[];
  currentStep: number;
  completed: boolean;
  modalViewed?: boolean; // Existing field for backward compatibility
  tikTokPhaseComplete?: boolean; // Track completion of TikTok tutorial phase
  profileNavigationState?: "initial" | "on-tiktok" | "returned-to-profile"; // Track profile navigation flow
  currentTutorialImage?: string; // Current tutorial image being displayed
  likesEnabled?: boolean; // Track if thumbnail liking is enabled
};

export const ONBOARDING_DATA_KEY = "bistro_onboarding_data";
export const ONBOARDING_DONE_KEY = "bistro_onboarding_done";
export const ONBOARDING_COOKIE_KEY = "bistro_onboarding_done";

export const TUT_DATA_KEY = "bistro_tutorial_data";

function hasBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export const LANE_OPTIONS = [
  "Educational bites",
  "Short-form cheap eats",
  "Travel Tips",
  "Others",
];

export function getInitialOnboardingData(): OnboardingData {
  if (!hasBrowserStorage()) {
    return { name: "", dataLane: [], challenge: "" };
  }

  const stored = localStorage.getItem(ONBOARDING_DATA_KEY);
  if (!stored) {
    return { name: "", dataLane: [], challenge: "" };
  }

  try {
    const parsed = JSON.parse(stored) as Record<string, unknown>;

    // Handle schema migrations
    const storedVersion = parsed.__schemaVersion as number | undefined;
    if (storedVersion !== SCHEMA_VERSION) {
      console.log(`Schema version mismatch: stored=${storedVersion}, current=${SCHEMA_VERSION}`);
      // For now, return defaults on version mismatch
      // Future: implement migrateSchema(parsed, storedVersion)
      return { name: "", dataLane: [], challenge: "" };
    }

    // Validate with zod
    const result = OnboardingSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }

    console.error("Onboarding data validation failed:", result.error);
    return { name: "", dataLane: [], challenge: "" };
  } catch (error) {
    console.error("Failed to parse onboarding data from storage", error);
    return { name: "", dataLane: [], challenge: "" };
  }
}

export function saveOnboardingData(data: OnboardingData) {
  if (!hasBrowserStorage()) {
    return;
  }

  // Validate data before saving
  const validated = OnboardingSchema.safeParse(data);
  if (!validated.success) {
    console.error("Invalid onboarding data:", validated.error);
    return;
  }

  // Include schema version for future migrations
  const versioned = { ...data, __schemaVersion: SCHEMA_VERSION };
  localStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(versioned));
}

export function isOnboardingDone(): boolean {
  if (!hasBrowserStorage()) {
    return false;
  }

  return localStorage.getItem(ONBOARDING_DONE_KEY) === "true";
}

export function markOnboardingDone(data: OnboardingData) {
  if (!hasBrowserStorage()) {
    return;
  }

  localStorage.setItem(ONBOARDING_DONE_KEY, "true");
  saveOnboardingData(data);
}

// Helper to validate onboarding data
export function validateOnboardingData(data: unknown): OnboardingData | null {
  const result = OnboardingSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error("Validation failed:", result.error);
  return null;
}

export function resetOnboardingState() {
  if (!hasBrowserStorage()) {
    return;
  }

  localStorage.removeItem(ONBOARDING_DONE_KEY);
  localStorage.removeItem(ONBOARDING_DATA_KEY);
  localStorage.removeItem(TUT_DATA_KEY);
}

const DEFAULT_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome to Solvi!",
    content:
      "Thank you again for letting me become your partner. You're here to build a scroll habit that turns into content. Let's show you around!",
    stepType: "standard",
  },
  {
    id: 2,
    title: "Solvi",
    content:
      "Tap this button below, you'll be moved to TikTok page.\n\n Follow the instruction in our tutorial (20 secs trust me!)",
    stepType: "standard",
  },
  {
    id: 5,
    title: "My Profile Navigation",
    content:
      "This is your recent saved video. You can see main idea and keywords. Click the Extend button on the bottom right to see more information.",
    stepType: "profile-guide",
    imageAsset: "/tutorial/My profile Guide #5.png",
  },
  {
    id: 6,
    title: "Explore Video Summary",
    content:
      'The analysis will take around 1 minute with the notification coming in later for you. \n Here, you can also click "More like this" to see other videos with the same idea once you save various videos later.',
    stepType: "profile-guide",
    imageAsset: "/tutorial/Vid Summary.png",
  },
  {
    id: 7,
    title: "You're All Set",
    content:
      "If you like the video, you can either share or love to save for our coming soon feature ^^",
    stepType: "profile-guide",
    imageAsset: "/tutorial/My profile Guide #6.png",
  },
  {
    id: 8,
    title: "Close the popup",
    content:
      "Now click the × button in the top right to close this popup and head back to your workspace.",
    stepType: "profile-guide",
  },
  {
    id: 9,
    title: "Solvi",
    content:
      "Nice! We're officially synced. Let's turn me into your new bookmark best friend.",
    stepType: "profile-guide",
  },
];

const ALLOWED_STEP_IDS = [1, 2, 5, 6, 7, 8, 9];
const ALLOWED_STEP_SET = new Set(ALLOWED_STEP_IDS);

export function getInitialTutorialData(): TutorialData {
  if (!hasBrowserStorage()) {
    return {
      steps: DEFAULT_STEPS,
      currentStep: 1,
      completed: false,
      tikTokPhaseComplete: false,
      profileNavigationState: "initial",
      currentTutorialImage: undefined,
      likesEnabled: false,
    };
  }

  const stored = localStorage.getItem(TUT_DATA_KEY);

  if (!stored) {
    return {
      steps: DEFAULT_STEPS,
      currentStep: 1,
      completed: false,
      tikTokPhaseComplete: false,
      profileNavigationState: "initial",
      currentTutorialImage: undefined,
      likesEnabled: false,
    };
  }

  try {
    const parsed = JSON.parse(stored) as Partial<TutorialData>;
    const parsedSteps = Array.isArray(parsed.steps)
      ? parsed.steps.filter(
          (step): step is TutorialStep =>
            typeof step.id === "number" &&
            typeof step.title === "string" &&
            typeof step.content === "string",
        )
      : [];

    const normalizedStoredSteps = parsedSteps
      .filter((step) => ALLOWED_STEP_SET.has(step.id))
      .sort((a, b) => a.id - b.id);

    const hasCompleteStoredSteps = ALLOWED_STEP_IDS.every((id) =>
      normalizedStoredSteps.some((step) => step.id === id),
    );

    const normalizedCurrentStep =
      typeof parsed.currentStep === "number"
        ? ALLOWED_STEP_SET.has(parsed.currentStep)
          ? parsed.currentStep
          : 9
        : 1;

    return {
      steps: hasCompleteStoredSteps ? normalizedStoredSteps : DEFAULT_STEPS,
      currentStep: normalizedCurrentStep,
      completed:
        typeof parsed.completed === "boolean" ? parsed.completed : false,
      modalViewed:
        typeof parsed.modalViewed === "boolean"
          ? parsed.modalViewed
          : undefined,
      tikTokPhaseComplete:
        typeof parsed.tikTokPhaseComplete === "boolean"
          ? parsed.tikTokPhaseComplete
          : false,
      profileNavigationState: parsed.profileNavigationState || "initial",
      currentTutorialImage: parsed.currentTutorialImage,
      likesEnabled:
        typeof parsed.likesEnabled === "boolean" ? parsed.likesEnabled : false,
    };
  } catch (error) {
    console.error("Failed to parse tutorial data from storage", error);
    return {
      steps: DEFAULT_STEPS,
      currentStep: 1,
      completed: false,
      tikTokPhaseComplete: false,
      profileNavigationState: "initial",
      currentTutorialImage: undefined,
      likesEnabled: false,
    };
  }
}
