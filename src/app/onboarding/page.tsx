import type { Metadata } from "next";
import OnboardingPageClient from "@/components/onboarding/OnboardingPageClient";

export const metadata: Metadata = { title: "Onboarding" };

export default function OnboardingPage() {
  return <OnboardingPageClient />;
}
