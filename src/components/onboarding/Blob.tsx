"use client";

export default function Blob({
  color,
  className,
}: {
  color: string;
  className: string;
}) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(48px)",
        opacity: 0.6,
      }}
    />
  );
}
