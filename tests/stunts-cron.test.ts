import { describe, expect, it } from "vitest";
import { isAuthorizedCron } from "@/lib/cron";
import { entrySchema } from "@/lib/stunts/schema";

describe("tâche planifiée", () => {
  const secret = "un-secret-de-test-suffisamment-long";
  it("n'accepte que le bon secret", () => {
    expect(isAuthorizedCron(`Bearer ${secret}`, secret)).toBe(true);
    expect(isAuthorizedCron(`Bearer ${secret}x`, secret)).toBe(false);
    expect(isAuthorizedCron(secret, secret)).toBe(false);
    expect(isAuthorizedCron(null, secret)).toBe(false);
    expect(isAuthorizedCron(`Bearer ${secret}`, undefined)).toBe(false);
  });
});

describe("formulaire de participation", () => {
  const ok = { competitionId: "00000000-0000-4000-8000-000000000001", title: "Saut du quai", url: "https://youtu.be/dQw4w9WgXcQ", rules: "on" };
  it("accepte une participation complète", () => {
    expect(entrySchema.safeParse(ok).success).toBe(true);
  });
  it("exige le règlement, un titre et un lien autorisé", () => {
    expect(entrySchema.safeParse({ ...ok, rules: undefined }).success).toBe(false);
    expect(entrySchema.safeParse({ ...ok, title: "a" }).success).toBe(false);
    expect(entrySchema.safeParse({ ...ok, url: "https://exemple.com/v.mp4" }).success).toBe(false);
  });
});
