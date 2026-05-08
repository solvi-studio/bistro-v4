"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import MascotAvatar from "../MascotAvatar";
import Blob from "../Blob";

const LOADING_PHASES = [
  { pct: 25, msg: "Alright...I've got a starting point!" },
  { pct: 50, msg: "We'll figure the rest out together as you go" },
  { pct: 80, msg: "First, let's confirm some deets about you..." },
];

interface LoadingScreenProps {
  onDone: () => void;
}

export default function LoadingScreen({ onDone }: LoadingScreenProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const phase = LOADING_PHASES[phaseIdx];

  useEffect(() => {
    if (!barRef.current) return;

    const tween = gsap.to(barRef.current, {
      width: `${phase.pct}%`,
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => {
        setTimeout(() => {
          if (phaseIdx < LOADING_PHASES.length - 1) {
            setPhaseIdx((i) => i + 1);
          } else {
            onDone();
          }
        }, 600);
      },
    });

    return () => {
      tween.kill();
    };
  }, [onDone, phase.pct, phaseIdx]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full max-w-160 px-8 flex flex-col items-center text-center"
    >
      <Blob color="#f5d88a" className="w-60 h-60 -bottom-20 -left-20" />
      <Blob color="#93c5fd" className="w-50 h-50 -top-15 -right-15" />
      <div className="relative flex flex-col items-center">
        <MascotAvatar size={130} />
        <p className="text-[15px] text-[#bbb] mb-4 font-semibold tracking-wide">
          {phase.pct}%
        </p>
        <p className="text-[24px] font-semibold text-[#1a1a1a] leading-[1.35] mb-2 max-w-160">
          {phase.msg}
        </p>
        <p className="text-[14px] text-[#aaa]">Building your space</p>
      </div>
      <div className="mt-8 h-[5px] w-full overflow-hidden rounded-full bg-[#eee]">
        <div
          ref={barRef}
          className="h-full rounded-full bg-[#3b7cf4]"
          style={{ width: "0%" }}
        />
      </div>
    </motion.div>
  );
}
