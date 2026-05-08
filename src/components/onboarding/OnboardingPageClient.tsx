"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { isOnboardingDone } from "@/utils/onboarding";

type GateStatus = "checking" | "ready" | "redirecting";

export default function OnboardingPageClient() {
  const router = useRouter();
  const [status, setStatus] = useState<GateStatus>("checking");

  useEffect(() => {
    if (isOnboardingDone()) {
      setStatus("redirecting");
      router.replace("/");
      return;
    }

    setStatus("ready");
  }, [router]);

  if (status !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-zinc-500">
        Loading onboarding…
      </div>
    );
  }

  return <OnboardingFlow onComplete={() => router.replace("/login")} />;
}
