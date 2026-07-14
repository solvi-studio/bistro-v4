"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { gsap } from "@/lib/gsap";

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".feature-card",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            once: true,
          },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="w-full py-20 px-6 bg-white h-[120vh]">
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-10">
        <div className="flex flex-col sm:flex-row items-start justify-evenly md:gap-15 lg:gap-32 sm:gap-10">
          <div className="feature-card" style={{ opacity: 0 }}>
            <FeatureCard
              title="Brainstorm with mindmap"
              rotation={-7}
              image={
                <Image
                  src="/redesign/card-mindmap.png"
                  alt=""
                  fill
                  className="object-contain"
                  priority
                />
              }
              caption="Dump everything in your head. Solvi structures it into your story — angles, hooks, tone, format — all in one canvas."
              bgColor="transparent"
              captionColor="#FBA400"
            />
          </div>

          <div className="feature-card" style={{ opacity: 0 }}>
            <FeatureCard
              title="Summarise your idea"
              image={
                <Image
                  src="/redesign/card-shotlist.png"
                  alt=""
                  fill
                  sizes="220px"
                  className="object-contain"
                />
              }
              caption="Your messy whiteboard becomes a clean, clustered shot list. AI organises what you created — not what everyone else is making."
              bgColor="transparent"
              captionColor="#EF524E"
            />
          </div>

          <div className="feature-card" style={{ opacity: 0 }}>
            <FeatureCard
              title="Arrange your schedule"
              rotation={7}
              image={
                <Image
                  src="/redesign/card-calendar.png"
                  alt=""
                  fill
                  className="object-contain"
                />
              }
              caption="Tasks land on a real calendar. Pre-production, shoot day, post — your creative sprint is mapped out before you press record."
              bgColor="transparent"
              captionColor="#3377FF"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
