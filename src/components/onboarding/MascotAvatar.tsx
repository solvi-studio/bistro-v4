"use client";

import Image from "next/image";

export default function MascotAvatar({
  size = 64,
  src,
}: {
  size?: number;
  src?: string;
}) {
  return (
    <div className="flex justify-center mb-6">
      <Image
        src={src ?? "/icon/mascot.png"}
        alt="Solvi"
        className="rounded-full object-cover"
        width={size}
        height={size}
      />
    </div>
  );
}
