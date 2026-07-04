"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listIdeas } from "@/lib/db/actions/ideas";
import type { CreativeScript } from "@/types/creative";
import { getFolders } from "@/utils/creative";
import CreateIdeaCard from "./CreateIdeaCard";
import IdeaCard from "./IdeaCard";

export default function CreativeSpacesClient() {
  const router = useRouter();
  const [scripts, setScripts] = useState<CreativeScript[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    listIdeas()
      .then((ideas) => {
        setScripts(ideas);
        setMounted(true);
      })
      .catch((err) => {
        console.error("Failed to load ideas:", err);
        setMounted(true);
      });
  }, []);

  function handleStartNewPage() {
    const folderId = getFolders()[0]?.id ?? "f-default";
    const query = `?folder=${encodeURIComponent(folderId)}`;
    router.push(`/creative/new${query}`);
  }

  return (
    <div className="px-2 py-6 md:px-5 md:py-9">
      <h1 className="text-2xl font-bold text-gray-900 md:text-[30px]">
        Your's Canvas
      </h1>
      <p className="mt-1 text-sm text-gray-400">Recent Creative Ideas</p>

      {/* 3 per row, each card stretches to fill its third — no dead space. */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:mt-7">
        <CreateIdeaCard onClick={handleStartNewPage} />
        {mounted &&
          scripts.map((script) => <IdeaCard key={script.id} script={script} />)}
      </div>
    </div>
  );
}
