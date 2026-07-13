import { AISection } from "@/components/landing/AISection";
import { CTASection } from "@/components/landing/CTASection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { CursorScope } from "@/components/CursorScope";

export default function Home() {
  return (
    <CursorScope>
      <main className="flex flex-col w-full min-h-screen overflow-x-hidden bg-white">
        <HeroSection />
        <FeaturesSection />
        <AISection />
        <CTASection />
      </main>
    </CursorScope>
  );
}
