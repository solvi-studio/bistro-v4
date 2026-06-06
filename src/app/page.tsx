"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isOnboardingDone } from "@/utils/onboarding";
import Link from "next/link";
import dynamic from "next/dynamic";
import Blob from "@/components/onboarding/Blob";
import MascotAvatar from "@/components/onboarding/MascotAvatar";

const BackgroundCanvas = dynamic(
  () => import("@/components/onboarding/t3-empty/backgroundCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 to-purple-50" />
    ),
  },
);

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isUserLoaded) return;

    if (!isSignedIn) {
      setReady(true);
      return;
    }

    if (!isOnboardingDone(user?.unsafeMetadata)) {
      router.replace("/onboarding");
      return;
    }

    router.replace("/canvas");
  }, [router, isSignedIn, isLoaded, user, isUserLoaded]);

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white font-poppins flex items-center justify-center overflow-hidden">
      <BackgroundCanvas />
      <Blob color="#fca5a5" className="w-50 h-50 -top-15 -left-15" />
      <Blob color="#86efac" className="w-50 h-50 -bottom-10 -right-10" />
      <Blob color="#93c5fd" className="w-60 h-60 -top-20 -right-20 opacity-40" />
      <div className="relative flex flex-col items-center text-center px-8">
        <MascotAvatar size={80} />
        <h1 className="text-[40px] font-semibold text-[#1a1a1a] leading-tight mb-3">
          Welcome to Solvi
        </h1>
        <p className="text-[16px] text-[#52596b] mb-8 max-w-sm">
          Your creative companion for content creation
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/sign-up"
            className="rounded-full bg-[#3b7cf4] px-8 py-3.5 text-[16px] font-semibold text-white transition-colors hover:bg-[#2f67dc] shadow-md"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="text-[14px] text-[#52596b] hover:text-[#1a1a1a] transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
