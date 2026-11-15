import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressionCard } from "@/components/profile/progression-card";
import { reviewSchema, REJECTION_REASONS } from "@/lib/reviews/schema";
import { BADGES, XP_REASON_LABELS } from "@/lib/xp/badges";
import { XP_REWARDS } from "@/lib/xp/levels";

const migration = readFileSync("supabase/migrations/20261118000000_phase5_xp_avis_badges.sql", "utf8");

describe("avis VICE ATLAS", () => {
  it("accepte toutes les notes de 1 à 5 avec un commentaire de 30 caractères", () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      expect(reviewSchema.safeParse({ rating: String(rating), comment: "x".repeat(30) }).success).toBe(true);
    }
  });
  it("refuse note absente, hors limites ou commentaire trop court", () => {
    expect(reviewSchema.safeParse({ rating: null, comment: "x".repeat(40) }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: "0", comment: "x".repeat(40) }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: "6", comment: "x".repeat(40) }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: "3", comment: "   trop court   " }).success).toBe(false);
  });
  it("ne propose aucun motif de refus lié à la note", () => {
    REJECTION_REASONS.forEach((r) => expect(r.toLowerCase()).not.toMatch(/note|étoile|négati/));
  });
  it("la récompense SQL ne dépend pas de la note", () => {
    const fn = migration.slice(migration.indexOf("function public.moderate_review"), migration.indexOf("function public.review_stats"));
    expect(fn).toContain("private.grant_xp(r.user_id, 20, 'review_approved'");
    expect(fn).not.toMatch(/r\.rating/);
  });
});

describe("XP et badges", () => {
  it("le catalogue des badges correspond exactement à la base", () => {
    const sqlIds = [...migration.matchAll(/\('([a-z-]+)', '[^']+', '[^']+', \d\)/g)].map((m) => m[1]);
    expect(sqlIds).toEqual(BADGES.map((b) => b.id));
  });
  it("les montants SQL respectent le barème", () => {
    expect(migration).toContain(`grant_xp(v_uid, ${XP_REWARDS.profileCompleted}, 'profile_completed'`);
    expect(migration).toContain(`grant_xp(r.user_id, ${XP_REWARDS.reviewApproved}, 'review_approved'`);
  });
  it("chaque motif d'XP a un libellé lisible", () => {
    const enumValues = migration.match(/create type public\.xp_reason as enum \(([^)]+)\)/)![1].match(/'([a-z_]+)'/g)!.map((s) => s.slice(1, -1));
    enumValues.forEach((v) => expect(XP_REASON_LABELS[v], v).toBeTruthy());
  });
  it("affiche le niveau, la barre et les badges obtenus", () => {
    render(<ProgressionCard data={{ xp: 175, level: 2, badges: [{ id: "premier-avis", name: "Premier avis", awardedAt: "2026-11-15" }], progress: null }} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText(/1\/8/)).toBeInTheDocument();
    expect(screen.getByTitle("A donné son avis sur VICE ATLAS.")).toHaveTextContent("obtenu");
  });
});
