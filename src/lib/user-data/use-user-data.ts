"use client";

import { useEffect, useSyncExternalStore } from "react";
import { emptyUserData, type UserData } from "./schema";
import { createUserDataStore, STORAGE_KEY } from "./store";

const safeStorage = () => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

/** Instance partagée par toute l'application (navigateur). */
export const userData = createUserDataStore({ storage: safeStorage });

const SERVER_SNAPSHOT: UserData = emptyUserData();
const getServerSnapshot = () => SERVER_SNAPSHOT;

let wired = false;
function wireBrowserEvents() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) userData.reload();
  });
  window.addEventListener("pagehide", () => userData.flush());
}

/** Lit les données du joueur ; le rendu serveur voit un état vide. */
export function useUserData(): UserData {
  useEffect(wireBrowserEvents, []);
  return useSyncExternalStore(userData.subscribe, userData.getState, getServerSnapshot);
}

export function useSaveStatus() {
  return useSyncExternalStore(userData.subscribe, userData.getStatus, () => "idle" as const);
}
