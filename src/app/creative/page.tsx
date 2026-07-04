import type { Metadata } from "next";
import CreativeSpacesClient from "@/components/creative/CreativeSpacesClient";

export const metadata: Metadata = { title: "Creative" };

export default function CreativePage() {
  return <CreativeSpacesClient />;
}
