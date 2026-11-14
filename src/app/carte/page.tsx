import type { Metadata } from "next";
import { CarteClient } from "@/components/map/carte-client";
import { getGuides, getPlaces, placeCategories } from "@/lib/content/repository";

export const metadata: Metadata = {
  title: "Carte interactive",
  description: "Explore la carte VICE ATLAS : lieux, spots de Stunt, collectibles, favoris et lieux visités.",
};

export default async function CartePage() {
  const [places, guides] = await Promise.all([getPlaces(), getGuides()]);
  return (
    <section className="h-dvh pt-[5.25rem] lg:px-5 lg:pt-24 lg:pb-5">
      <CarteClient
        places={places}
        categories={placeCategories}
        guides={guides.map((g) => ({ slug: g.slug, title: g.title }))}
      />
    </section>
  );
}
