import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inspiration" };

export default function InspirationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
