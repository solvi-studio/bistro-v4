import { Suspense } from "react";
import CreateProjectModal from "@/components/creative/CreateProjectModal";

export default function CreativeNewPage() {
  return (
    <Suspense fallback={null}>
      <CreateProjectModal />
    </Suspense>
  );
}
