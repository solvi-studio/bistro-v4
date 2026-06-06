"use client";

import { SignIn } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
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

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isSignedIn) {
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
      <div className="relative flex flex-col items-center px-4">
        <MascotAvatar size={72} />
        <SignIn />
      </div>
    </div>
  );
}
