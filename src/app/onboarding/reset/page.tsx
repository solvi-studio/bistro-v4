"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { resetOnboardingState } from "@/utils/onboarding";

const isResetRouteEnabled = process.env.NODE_ENV !== "production";

export default function OnboardingResetPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isResetRouteEnabled) {
      router.replace("/");
      return;
    }

    resetOnboardingState();
    router.replace("/onboarding");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-sm text-zinc-500">
      Resetting onboarding…
    </div>
  );
}
