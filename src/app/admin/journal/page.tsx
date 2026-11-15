import { Suspense } from "react";
import { AdminAccessDenied } from "@/components/admin/admin-access";
import { Spinner } from "@/components/states/spinner";
import { getEditorContext } from "@/lib/auth/editor";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Journal d'audit" };

const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium", timeZone: "Europe/Paris" });

export default function JournalPage() {
  return (
    <>
      <h1 className="text-4xl font-bold">Journal d&apos;audit</h1>
      <p className="mt-2 text-muted-foreground">Rôles, modérations, corrections d&apos;XP, badges, lieux, guides et résultats : chaque action sensible est tracée (heure de Paris).</p>
      <div className="mt-6">
        <Suspense fallback={<Spinner label="Chargement…" />}>
          <Log />
        </Suspense>
      </div>
    </>
  );
}

async function Log() {
  const ctx = await getEditorContext();
  if (ctx.status === "unconfigured") return <p className="text-muted-foreground">Base de données non configurée.</p>;
  if (ctx.status !== "ok") return <AdminAccessDenied ctx={ctx} />;
  if (ctx.role !== "admin") return <p className="text-muted-foreground">Le journal d&apos;audit est réservé aux administrateurs.</p>;
  const sb = await createSupabaseServerClient();
  const { data } = await sb.from("audit_log").select("id,action,target_table,target_id,details,created_at,actor_id").order("created_at", { ascending: false }).limit(200);
  const actors = [...new Set((data ?? []).map((d) => d.actor_id).filter(Boolean))] as string[];
  const { data: names } = actors.length ? await sb.from("profiles").select("id,username").in("id", actors) : { data: [] };
  const nameOf = (id: string | null) => (id ? (names ?? []).find((n) => n.id === id)?.username ?? "compte supprimé" : "système");
  if (!data?.length) return <p className="text-muted-foreground">Aucune action enregistrée.</p>;
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-white/[0.04] text-xs tracking-wider text-muted-foreground uppercase">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Auteur</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Détails</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {data.map((d) => (
            <tr key={d.id} className="align-top">
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">{fmt.format(new Date(d.created_at))}</td>
              <td className="px-4 py-3">{nameOf(d.actor_id)}</td>
              <td className="px-4 py-3">
                {d.action} · {d.target_table}
              </td>
              <td className="max-w-md px-4 py-3">
                <code className="line-clamp-3 text-xs break-all text-ink/70">{JSON.stringify(d.details)}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
