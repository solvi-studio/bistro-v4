"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { resetOnboardingState } from "@/utils/onboarding";

const isResetRouteEnabled = process.env.NODE_ENV !== "production";

export default function OnboardingResetPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isResetRouteEnabled) {
      router.replace("/");
      return;
    }

    if (!user) {
      router.replace("/sign-in");
      return;
    }

    resetOnboardingState(async (metadata) => {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, ...metadata } });
    });
    router.replace("/onboarding");
  }, [router, user, isLoaded]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-sm text-zinc-500">
      Resetting onboarding…
    </div>
  );
}
