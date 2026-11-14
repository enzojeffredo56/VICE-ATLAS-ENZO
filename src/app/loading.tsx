import { Spinner } from "@/components/states/spinner";

export default function Loading() {
  return (
    <div className="grid min-h-[70svh] place-items-center pt-24">
      <Spinner label="Chargement de la carte…" />
    </div>
  );
}
