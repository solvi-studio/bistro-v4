import { z } from "zod";

export const SCHEMA_VERSION = 1;

export const OnboardingSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  dataLane: z.array(z.string()).min(1, "At least one content lane required"),
  challenge: z
    .string()
    .min(1, "Challenge is required")
    .max(500, "Challenge too long"),
  tiktokUrl: z.string().max(500).optional(),
});

export type OnboardingData = z.infer<typeof OnboardingSchema>;

export type TutorialStep = {
  id: number;
  title: string;
  content: string;
  imageAsset?: string;
  stepType?: "standard" | "tiktok-flow" | "profile-guide";
  subStep?: string;
};

export type TutorialData = {
  steps: TutorialStep[];
  currentStep: number;
  completed: boolean;
  modalViewed?: boolean;
  tikTokPhaseComplete?: boolean;
  profileNavigationState?: "initial" | "on-tiktok" | "returned-to-profile";
  currentTutorialImage?: string;
  likesEnabled?: boolean;
};

export const ONBOARDING_COOKIE_KEY = "bistro_onboarding_done";

export const TUT_DATA_KEY = "bistro_tutorial_data";

export const LANE_OPTIONS = [
  "Educational bites",
  "Short-form cheap eats",
  "Travel Tips",
  "Others",
];

export interface ClerkUnsafeMetadata {
  onboardingComplete?: boolean;
  onboardingData?: OnboardingData;
}

export function isOnboardingDone(
  unsafeMetadata: Record<string, unknown> | undefined,
): boolean {
  return unsafeMetadata?.onboardingComplete === true;
}

export async function markOnboardingDone(
  update: (metadata: Record<string, unknown>) => Promise<void>,
  data: OnboardingData,
) {
  const validated = OnboardingSchema.safeParse(data);
  if (!validated.success) {
    console.error("Invalid onboarding data:", validated.error);
    return;
  }

  const versioned = { ...data, __schemaVersion: SCHEMA_VERSION };
  await update({
    onboardingComplete: true,
    onboardingData: versioned,
  });
}

export async function resetOnboardingState(
  update: (metadata: Record<string, unknown>) => Promise<void>,
) {
  await update({
    onboardingComplete: false,
    onboardingData: null,
  });
}

export function validateOnboardingData(data: unknown): OnboardingData | null {
  const result = OnboardingSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error("Validation failed:", result.error);
  return null;
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
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
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
