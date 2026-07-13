"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function CTASection() {
  return (
    <section className="w-full py-20 px-6 bg-[#F2F2F5]">
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-12">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-10 w-full">
          {/* Photo mockup */}
          <ScrollReveal direction="up" className="flex-shrink-0">
            <div className="relative w-[260px] h-[314px] rounded-[30px] overflow-hidden shadow-xl bg-[#FEECB8]">
              <Image
                src="/redesign/pancake.jpg"
                alt=""
                fill
                sizes="260px"
                className="object-cover"
              />
            </div>
          </ScrollReveal>

          {/* Headline */}
          <ScrollReveal
            direction="right"
            delay={0.15}
            className="flex-1 max-w-[320px] flex flex-col gap-3"
          >
            <h2 className="text-2xl sm:text-3xl font-poppins font-semibold text-[#0C8F8F] leading-snug">
              Start with one idea.
            </h2>
            <p className="text-sm font-poppins font-semibold text-gray-700 leading-relaxed">
              No brief. No template. Just type what&apos;s in your head — Solvi
              does the rest.
            </p>
          </ScrollReveal>
        </div>

        {/* CTA button */}
        <ScrollReveal direction="up" delay={0.3}>
          <Button
            variant="coral"
            href="#download"
            className="px-10 py-4 text-base font-poppins font-bold"
          >
            Let&apos;s go
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}
