import { describe, expect, it } from "vitest";
import { describeAuthError, profileUpdateSchema, safeNextPath, signUpSchema } from "@/lib/auth/schemas";

const valid = {
  username: "Neon_Rider",
  email: "  Joueur@Exemple.FR ",
  password: "motdepasse1",
  confirm: "motdepasse1",
  referralCode: "",
  terms: "on",
  website: "",
};

describe("inscription", () => {
  it("accepte une inscription valide et normalise l'e-mail", () => {
    const r = signUpSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("joueur@exemple.fr");
  });

  it.each([
    ["username", "ab", /3 à 20/],
    ["username", "nom avec espace", /3 à 20/],
    ["password", "court1", /8 caractères/],
    ["password", "sanschiffre", /chiffre/],
    ["password", "12345678", /lettre/],
    ["email", "pas-un-email", /invalide/],
  ])("refuse %s = %s", (field, value, message) => {
    const r = signUpSchema.safeParse({ ...valid, [field]: value, ...(field === "password" ? { confirm: value } : {}) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.find((i) => i.path[0] === field)?.message).toMatch(message);
  });

  it("vérifie la confirmation du mot de passe et les conditions", () => {
    expect(signUpSchema.safeParse({ ...valid, confirm: "autrechose1" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, terms: undefined }).success).toBe(false);
  });

  it("bloque les robots qui remplissent le champ piège", () => {
    expect(signUpSchema.safeParse({ ...valid, website: "http://spam" }).success).toBe(false);
  });

  it("met le code de parrainage en majuscules et vérifie son format", () => {
    const r = signUpSchema.safeParse({ ...valid, referralCode: "abcd2345" });
    expect(r.success && r.data.referralCode).toBe("ABCD2345");
    expect(signUpSchema.safeParse({ ...valid, referralCode: "ABC" }).success).toBe(false);
  });
});

describe("profil", () => {
  it("limite la biographie à 280 caractères", () => {
    expect(profileUpdateSchema.safeParse({ username: "Joueur_1", bio: "x".repeat(281), isPublic: false, showProgress: false }).success).toBe(false);
  });
});

describe("redirection après connexion", () => {
  it.each([
    ["/carnet", "/carnet"],
    ["/guide/tour?x=1", "/guide/tour?x=1"],
    ["https://pirate.example", "/profil"],
    ["//pirate.example", "/profil"],
    ["/\\pirate.example", "/profil"],
    [null, "/profil"],
    ["/ok\nSet-Cookie", "/profil"],
  ])("safeNextPath(%s) → %s", (input, out) => {
    expect(safeNextPath(input)).toBe(out);
  });
});

describe("messages d'erreur", () => {
  it("ne révèle pas si un compte existe", () => {
    expect(describeAuthError("user_already_exists", "x")).toMatch(/Si cette adresse est libre/);
    expect(describeAuthError("invalid_credentials", "x")).toBe("E-mail ou mot de passe incorrect.");
    expect(describeAuthError("inconnu", "Par défaut")).toBe("Par défaut");
  });
});
