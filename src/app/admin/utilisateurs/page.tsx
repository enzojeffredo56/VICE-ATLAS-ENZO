import { Suspense } from "react";
import { AdminAccessDenied } from "@/components/admin/admin-access";
import { UserAdminList, type AdminUser } from "@/components/admin/user-admin";
import { Spinner } from "@/components/states/spinner";
import { getEditorContext } from "@/lib/auth/editor";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Utilisateurs" };

export default function UsersPage({ searchParams }: PageProps<"/admin/utilisateurs">) {
  return (
    <>
      <h1 className="text-4xl font-bold">Utilisateurs</h1>
      <form className="mt-6 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          Rechercher un pseudo
        </label>
        <input id="q" name="q" placeholder="Rechercher un pseudo…" className="h-11 flex-1 rounded-full border border-white/12 bg-night px-4" />
        <button className="h-11 cursor-pointer rounded-full bg-gradient-to-r from-pink to-violet px-5 font-semibold">Rechercher</button>
      </form>
      <div className="mt-6">
        <Suspense fallback={<Spinner label="Chargement…" />}>
          <Users searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Users({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await getEditorContext();
  if (ctx.status === "unconfigured") return <p className="text-muted-foreground">Base de données non configurée.</p>;
  if (ctx.status !== "ok") return <AdminAccessDenied ctx={ctx} />;
  const q = String((await searchParams).q ?? "").replace(/[^A-Za-z0-9_]/g, "").slice(0, 20);
  const sb = await createSupabaseServerClient();
  let query = sb.from("profiles").select("id,username,is_public,created_at,user_roles(role),user_badges(badge_id),xp_events(id,amount,reason,note,created_at,reverses_id)").order("created_at", { ascending: false }).limit(50);
  if (q) query = query.ilike("username", `%${q}%`);
  const { data } = await query;
  const users: AdminUser[] = (data ?? []).map((p) => {
    const events = ((p.xp_events as unknown as { id: number; amount: number; reason: string; note: string | null; created_at: string; reverses_id: number | null }[]) ?? []).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const reversed = new Set(events.map((e) => e.reverses_id).filter(Boolean));
    return {
      id: p.id,
      username: p.username,
      isPublic: p.is_public,
      createdAt: p.created_at,
      role: ((p.user_roles as unknown as { role: AdminUser["role"] } | null)?.role ?? "user") as AdminUser["role"],
      badges: ((p.user_badges as unknown as { badge_id: string }[]) ?? []).map((b) => b.badge_id),
      xp: events.reduce((s, e) => s + e.amount, 0),
      events: events.slice(0, 30).map((e) => ({ id: e.id, amount: e.amount, reason: e.reason, note: e.note, createdAt: e.created_at, reversed: reversed.has(e.id) })),
    };
  });
  if (!users.length) return <p className="text-muted-foreground">Aucun joueur trouvé.</p>;
  return <UserAdminList users={users} canEdit={ctx.role === "admin"} />;
}
