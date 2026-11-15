import { parisToUtc } from "@/lib/time/paris";

/**
 * Calendrier STUNT ARENA (heure de Paris) — identique à la base :
 *   participations : lundi 00:00 → vendredi 23:59:59
 *   votes          : samedi 00:00 → dimanche 23:59:59
 *   vérification   : ensuite, jusqu'à confirmation par un modérateur
 */
export type StuntPhase = "a-venir" | "participations" | "votes" | "verification" | "resultats";

export type Schedule = { submissionsOpenAt: Date; submissionsCloseAt: Date; votingCloseAt: Date };

function addDays(weekStart: string, days: number) {
  const [y, m, d] = weekStart.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return parisToUtc(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function scheduleForWeek(weekStart: string): Schedule {
  return { submissionsOpenAt: addDays(weekStart, 0), submissionsCloseAt: addDays(weekStart, 5), votingCloseAt: addDays(weekStart, 7) };
}

export function phaseAt(s: Schedule, now: Date, confirmed = false): StuntPhase {
  if (confirmed) return "resultats";
  if (now < s.submissionsOpenAt) return "a-venir";
  if (now < s.submissionsCloseAt) return "participations";
  if (now < s.votingCloseAt) return "votes";
  return "verification";
}

export const PHASE_LABELS: Record<StuntPhase, { label: string; description: string }> = {
  "a-venir": { label: "Bientôt", description: "Le concours ouvre lundi à 00:00." },
  participations: { label: "Participations ouvertes", description: "Publie ta vidéo jusqu'à vendredi 23:59." },
  votes: { label: "Votes ouverts", description: "Vote pour ta cascade préférée jusqu'à dimanche 23:59." },
  verification: { label: "Vérification", description: "Les votes sont clos : l'équipe vérifie les résultats." },
  resultats: { label: "Résultats", description: "Le classement est confirmé." },
};

/** Classement « 1, 1, 3 » : les égalités partagent la place. */
export function rankEntries<T extends { votes: number }>(entries: T[]): (T & { rank: number })[] {
  const sorted = [...entries].sort((a, b) => b.votes - a.votes);
  return sorted.map((e, i) => ({ ...e, rank: i > 0 && sorted[i - 1].votes === e.votes ? 0 : i + 1 })).map((e, i, arr) => {
    if (e.rank !== 0) return e;
    let j = i;
    while (arr[j].rank === 0) j--;
    return { ...e, rank: arr[j].rank };
  });
}

/** XP de podium (cahier des charges). */
export const PODIUM_XP = { 1: 150, 2: 75, 3: 40 } as const;
