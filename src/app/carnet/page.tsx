import type { Metadata } from "next";
import { CarnetClient } from "@/components/carnet/carnet-client";
import { getPlaces, getProgressItems } from "@/lib/content/repository";

export const metadata: Metadata = {
  title: "Carnet de progression",
  description: "Suis tes missions, activités, lieux, collectibles, découvertes et objectifs personnels.",
  robots: { index: false },
};

export default async function CarnetPage() {
  const [items, places] = await Promise.all([getProgressItems(), getPlaces()]);
  return <CarnetClient items={items} places={places} />;
}
