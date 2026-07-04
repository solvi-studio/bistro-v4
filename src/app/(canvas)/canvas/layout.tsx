import type { Metadata } from "next";

export const metadata: Metadata = { title: "Canvas" };

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
