"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { gsap } from "@/lib/gsap";

const ICONS = [
  {
    label: "Instagram",
    startAngle: -Math.PI / 2, // top
    radius: 115,
    speed: gsap.utils.random(5, 15) * 0.001,
    bg: "#E1306C",
    icon: (
      <Image
        src="/redesign/instagram-circle.svg"
        alt=""
        width={20}
        height={20}
        className="w-5 h-5"
      />
    ),
  },
  {
    label: "TikTok",
    startAngle: Math.PI / 2, // bottom
    radius: 115,
    speed: gsap.utils.random(5, 15) * 0.001,
    bg: "#010101",
    icon: (
      <Image
        src="/redesign/tiktok-circle.svg"
        alt=""
        width={20}
        height={20}
        className="w-5 h-5"
      />
    ),
  },
  {
    label: "Chrome",
    startAngle: Math.PI, // left
    radius: 115,
    speed: gsap.utils.random(5, 15) * 0.001,
    bg: "#F2F2F5",
    icon: (
      <Image
        src="/redesign/chrome.svg"
        alt=""
        width={20}
        height={20}
        className="w-5 h-5"
      />
    ),
  },
  {
    label: "YouTube",
    startAngle: 0, // right
    radius: 115,
    speed: gsap.utils.random(5, 15) * 0.001,
    bg: "#FF0000",
    icon: (
      <Image
        src="/redesign/youtube-circle.svg"
        alt=""
        width={20}
        height={20}
        className="w-5 h-5"
      />
    ),
  },
];

export function AISection() {
  const orbitRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Mascot float
      gsap.to(mascotRef.current, {
        y: -8,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Ring rotation
      gsap.to(ring1Ref.current, {
        rotation: 360,
        duration: gsap.utils.random(10, 15),
        repeat: -1,
        ease: "none",
      });
      gsap.to(ring2Ref.current, {
        rotation: -360,
        duration: gsap.utils.random(5, 25),
        repeat: -1,
        ease: "none",
      });
    }, orbitRef);

    // Orbit icons via ticker
    const angles = ICONS.map((icon) => icon.startAngle);

    const tick = () => {
      ICONS.forEach((icon, i) => {
        angles[i] += icon.speed;
        const el = iconRefs.current[i];
        if (!el) return;
        gsap.set(el, {
          x: Math.cos(angles[i]) * icon.radius,
          y: Math.sin(angles[i]) * icon.radius,
        });
      });
    };

    gsap.ticker.add(tick);
    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <section
      className="w-full py-24 px-6"
      style={{
        background: "linear-gradient(180deg, #EFF7F3 0%, #E8F0F8 100%)",
      }}
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-10">
        <ScrollReveal direction="up">
          <h2 className="text-5xl font-poppins font-bold text-[#3BA87A] leading-tight text-center">
            Why Us?
          </h2>
        </ScrollReveal>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full">
          <ScrollReveal
            direction="right"
            className="flex items-center gap-3 bg-[#E6EFFF] rounded-2xl px-5 py-4 max-w-[220px]"
          >
            <Image
              src="/redesign/clock.svg"
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 shrink-0"
            />
            <span className="text-sm font-poppins font-semibold text-gray-900">
              Save your time planning your content
            </span>
          </ScrollReveal>

          {/* Orbit system */}
          <div
            ref={orbitRef}
            className="relative flex items-center justify-center shrink-0"
            style={{ width: 300, height: 300 }}
          >
            {/* Dashed rings */}
            <div
              ref={ring1Ref}
              className="absolute rounded-full border-2 border-dashed border-red-400 opacity-60"
              style={{ width: 250, height: 250 }}
            />
            <div
              ref={ring2Ref}
              className="absolute rounded-full border-2 border-dashed border-blue-400 opacity-60"
              style={{ width: 185, height: 185 }}
            />

            {/* Center mascot */}
            <div
              ref={mascotRef}
              className="relative z-10 w-16 h-16 rounded-full overflow-hidden shadow-lg shadow-green-200"
            >
              <Image
                src="/solvi-mascot-icon.png"
                alt="Solvi"
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>

            {/* Orbiting icons */}
            {ICONS.map((icon, i) => (
              <div
                key={icon.label}
                ref={(el) => {
                  iconRefs.current[i] = el;
                }}
                className="absolute top-1/2 left-1/2 z-20"
                style={{
                  transform: `translate(calc(-50% + ${Math.cos(icon.startAngle) * icon.radius}px), calc(-50% + ${Math.sin(icon.startAngle) * icon.radius}px))`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                  style={{ backgroundColor: icon.bg }}
                  title={icon.label}
                >
                  {icon.icon}
                </div>
              </div>
            ))}
          </div>

          <ScrollReveal
            direction="left"
            className="flex items-center gap-3 bg-[#FDE5E3] rounded-2xl px-5 py-4 max-w-[220px]"
          >
            <Image
              src="/redesign/lightbulb.svg"
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 shrink-0"
            />
            <span className="text-sm font-poppins font-semibold text-gray-900">
              Assist you to become more creative
            </span>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
