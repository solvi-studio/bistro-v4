"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CreativeScript } from "@/types/creative";
import { getFolders, getScripts, isGuideSeen } from "@/utils/creative";
import CreateIdeaCard from "./CreateIdeaCard";
import IdeaCard from "./IdeaCard";

export default function CreativeSpacesClient() {
  const router = useRouter();
  const [scripts, setScripts] = useState<CreativeScript[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setScripts(getScripts());
    setMounted(true);
  }, []);

  function handleStartNewPage() {
    const folderId = getFolders()[0]?.id ?? "f-default";
    const query = `?folder=${encodeURIComponent(folderId)}`;
    // First-timers see the guide; afterwards jump straight to compose.
    router.push(
      isGuideSeen() ? `/creative/new${query}` : `/creative/guide${query}`,
    );
  }

  return (
    <div className="px-4 py-6 md:px-10 md:py-9">
      <h1 className="text-2xl font-bold text-gray-900 md:text-[30px]">Rita's Canvas</h1>
      <p className="mt-1 text-sm text-gray-400">Recent Creative Ideas</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-6 md:mt-7">
        <CreateIdeaCard onClick={handleStartNewPage} />
        {mounted &&
          scripts.map((script) => <IdeaCard key={script.id} script={script} />)}
      </div>
    </div>
  );
}
