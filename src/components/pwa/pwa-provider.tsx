"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type PwaState = { canInstall: boolean; install: () => Promise<void>; online: boolean; standalone: boolean };

const PwaContext = createContext<PwaState>({ canInstall: false, install: async () => {}, online: true, standalone: false });
export const usePwa = () => useContext(PwaContext);

/** Enregistre le service worker (production), gère l'installation et l'état hors ligne. */
export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [online, setOnline] = useState(true);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        /* le site fonctionne sans service worker */
      });
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      toast.success("VICE ATLAS est installé sur ton appareil !");
    };
    const goOffline = () => {
      setOnline(false);
      toast.info("Tu es hors ligne", { description: "Ton carnet reste enregistré sur l'appareil." });
    };
    const goOnline = () => {
      setOnline(true);
      toast.success("De retour en ligne");
    };
    const mq = window.matchMedia("(display-mode: standalone)");
    const syncStandalone = () => setStandalone(mq.matches);
    syncStandalone();
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    mq.addEventListener("change", syncStandalone);
    if (!navigator.onLine) setOnline(false);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      mq.removeEventListener("change", syncStandalone);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <PwaContext.Provider value={{ canInstall: Boolean(deferred), install, online, standalone }}>
      {!online && (
        <div role="status" className="fixed inset-x-0 top-0 z-[80] bg-pink px-4 py-1.5 text-center text-xs font-semibold text-white">
          Hors ligne · tes changements du carnet sont gardés sur l&apos;appareil
        </div>
      )}
      {children}
    </PwaContext.Provider>
  );
}

/** Bouton « Installer l'appli » (affiché seulement quand le navigateur le permet). */
export function InstallButton({ className }: { className?: string }) {
  const { canInstall, install } = usePwa();
  if (!canInstall) return null;
  return (
    <button type="button" onClick={install} className={className}>
      Installer l&apos;appli
    </button>
  );
}
