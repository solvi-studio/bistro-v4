import type { Metadata } from "next";
import { Suspense } from "react";
import CreateProjectModal from "@/components/creative/CreateProjectModal";

export const metadata: Metadata = { title: "New Space" };

export default function CreativeNewPage() {
  return (
    <Suspense fallback={null}>
      <CreateProjectModal />
    </Suspense>
  );
}
