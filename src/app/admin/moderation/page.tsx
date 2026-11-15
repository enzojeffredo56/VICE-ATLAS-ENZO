import { Suspense } from "react";
import { AdminAccessDenied } from "@/components/admin/admin-access";
import { ModerationQueue } from "@/components/admin/moderation-queue";
import { Spinner } from "@/components/states/spinner";
import { getEditorContext } from "@/lib/auth/editor";
import { moderateContributionAction } from "@/lib/community/actions";
import { moderateChallengeAction, moderateWeeklyAction } from "@/lib/roulette/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/text";

export const metadata = { title: "Modération" };

export default function ModerationPage() {
  return (
    <>
      <h1 className="text-4xl font-bold">Modération</h1>
      <Suspense fallback={<Spinner label="Chargement…" />}>
        <Queues />
      </Suspense>
    </>
  );
}

async function Queues() {
  const ctx = await getEditorContext();
  if (ctx.status === "unconfigured") return <p className="mt-6 text-muted-foreground">Base de données non configurée.</p>;
  if (ctx.status !== "ok") return <AdminAccessDenied ctx={ctx} />;
  const sb = await createSupabaseServerClient();
  const [{ data: contribs }, { data: challenges }, { data: weekly }] = await Promise.all([
    sb.from("contributions").select("id,kind,title,description,x,y,created_at,profiles(username),places!contributions_place_id_fkey(name)").eq("status", "pending").order("created_at").limit(100),
    sb.from("challenges").select("id,title,category,difficulty,created_at,profiles(username)").eq("status", "pending").is("room_id", null).order("created_at").limit(100),
    sb.from("weekly_submissions").select("id,proof_url,created_at,profiles(username),weekly_challenges(week_start,challenges(title))").eq("status", "pending").order("created_at").limit(100),
  ]);
  const user = (x: unknown) => (x as { username?: string } | null)?.username ?? "Joueur";
  return (
    <div className="mt-8 space-y-12">
      <section aria-labelledby="q-contrib">
        <h2 id="q-contrib" className="mb-4 text-2xl font-bold">
          Contributions ({contribs?.length ?? 0})
        </h2>
        <ModerationQueue
          approveLabel="Accepter"
          reasons={["Lieu déjà présent sur la carte", "Informations invérifiables", "Coordonnées incorrectes", "Hors sujet ou spam"]}
          onDecide={moderateContributionAction}
          items={(contribs ?? []).map((c) => ({
            id: c.id,
            title: c.title,
            meta: `${c.kind === "place_proposal" ? `Lieu proposé · X ${c.x} · Y ${c.y} (+50 XP si accepté)` : `Signalement · ${(c.places as unknown as { name: string } | null)?.name ?? "lieu"}`} · ${user(c.profiles)} · ${formatDateFr(c.created_at)}`,
            body: c.description,
          }))}
        />
      </section>
      <section aria-labelledby="q-chal">
        <h2 id="q-chal" className="mb-4 text-2xl font-bold">
          Défis proposés ({challenges?.length ?? 0})
        </h2>
        <ModerationQueue
          approveLabel="Ajouter à la roue"
          reasons={["Défi dangereux ou incitant à la triche", "Doublon d'un défi existant", "Formulation peu claire", "Hors sujet ou spam"]}
          onDecide={(id, d) => moderateChallengeAction(id, d)}
          items={(challenges ?? []).map((c) => ({ id: c.id, title: c.title, meta: `${c.category} · ${c.difficulty} · ${user(c.profiles)} · ${formatDateFr(c.created_at)}` }))}
        />
      </section>
      <section aria-labelledby="q-weekly">
        <h2 id="q-weekly" className="mb-4 text-2xl font-bold">
          Preuves du défi de la semaine ({weekly?.length ?? 0})
        </h2>
        <ModerationQueue
          approveLabel="Valider (+100 XP)"
          reasons={["La vidéo ne montre pas le défi", "Vidéo inaccessible", "Vidéo d'une autre personne", "Défi d'une autre semaine"]}
          onDecide={moderateWeeklyAction}
          items={(weekly ?? []).map((w) => {
            const wc = w.weekly_challenges as unknown as { week_start: string; challenges: { title: string } };
            return { id: w.id, title: wc.challenges.title, meta: `Semaine du ${formatDateFr(wc.week_start)} · ${user(w.profiles)}`, link: { href: w.proof_url, label: "Voir la vidéo" } };
          })}
        />
      </section>
    </div>
  );
}
