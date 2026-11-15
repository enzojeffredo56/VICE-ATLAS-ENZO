import { timingSafeEqual } from "node:crypto";

/** Vérifie l'en-tête « Authorization: Bearer <CRON_SECRET> » en temps constant. */
export function isAuthorizedCron(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
