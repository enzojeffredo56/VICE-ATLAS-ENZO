import { Suspense } from "react";
import { AdminAccessDenied } from "@/components/admin/admin-access";
import { ReferralAdmin, type RewardRow } from "@/components/plus/referral-admin";
import { Spinner } from "@/components/states/spinner";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/billing/plan";
import { paymentsEnabled } from "@/lib/billing/stripe";
import { getEditorContext } from "@/lib/auth/editor";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/text";

export const metadata = { title: "Premium et parrainage" };

export default function AdminPremiumPage() {
  return (
    <>
      <h1 className="text-4xl font-bold">Premium et parrainage</h1>
      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        Paiements : <Badge variant={paymentsEnabled() ? "turquoise" : "pink"}>{paymentsEnabled() ? "ouverts" : "fermés"}</Badge>
        (variable PAYMENTS_ENABLED, à n&apos;ouvrir qu&apos;après les tests de facturation en mode test)
      </p>
      <Suspense fallback={<Spinner label="Chargement…" />}>
        <Data />
      </Suspense>
    </>
  );
}

async function Data() {
  const ctx = await getEditorContext();
  if (ctx.status === "unconfigured") return <p className="mt-6 text-muted-foreground">Base de données non configurée.</p>;
  if (ctx.status !== "ok") return <AdminAccessDenied ctx={ctx} />;
  if (ctx.role !== "admin") return <p className="mt-6 text-muted-foreground">Réservé aux administrateurs.</p>;
  const sb = await createSupabaseServerClient();
  const [{ data: subs }, { data: pays }, { data: rewards }] = await Promise.all([
    sb.from("subscriptions").select("id,status,current_period_end,cancel_at_period_end,profiles(username)").order("updated_at", { ascending: false }).limit(100),
    sb.from("payments").select("id,amount_paid,currency,paid_at,refunded_amount,disputed,profiles(username)").order("paid_at", { ascending: false }).limit(100),
    sb.from("referral_rewards").select("id,status,eligible_at,cancelled_reason,referrer:profiles!referral_rewards_referrer_id_fkey(username),referee:profiles!referral_rewards_referee_id_fkey(username)").order("created_at", { ascending: false }).limit(200),
  ]);
  const u = (x: unknown) => (x as { username?: string } | null)?.username ?? "—";
  const active = (subs ?? []).filter((s) => ["active", "trialing"].includes(s.status)).length;
  const revenue = (pays ?? []).reduce((sum, p) => sum + p.amount_paid - p.refunded_amount, 0);
  const rows: RewardRow[] = (rewards ?? []).map((r) => ({ id: r.id, referrer: u(r.referrer), referee: u(r.referee), status: r.status, eligibleAt: r.eligible_at, reason: r.cancelled_reason }));
  return (
    <div className="mt-8 space-y-10">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Abonnés actifs", String(active)],
          ["Encaissé (100 derniers)", formatPrice(revenue)],
          ["Parrainages en vérification", String(rows.filter((r) => r.status === "pending").length)],
          ["Mois offerts accordés", String(rows.filter((r) => r.status === "granted").length)],
        ].map(([label, value]) => (
          <li key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-2xl font-bold">{value}</p>
          </li>
        ))}
      </ul>
      <section aria-labelledby="ref-title">
        <h2 id="ref-title" className="mb-4 text-2xl font-bold">
          Parrainages
        </h2>
        <ReferralAdmin rewards={rows} />
      </section>
      <section aria-labelledby="subs-title">
        <h2 id="subs-title" className="mb-4 text-2xl font-bold">
          Abonnements
        </h2>
        <ul className="divide-y divide-white/8 rounded-2xl border border-white/10 text-sm">
          {(subs ?? []).map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="min-w-0 flex-1">{u(s.profiles)}</span>
              <Badge>{s.status}</Badge>
              <span className="text-xs text-muted-foreground">
                {s.current_period_end ? `jusqu'au ${formatDateFr(s.current_period_end)}` : ""}
                {s.cancel_at_period_end ? " · résiliation programmée" : ""}
              </span>
            </li>
          ))}
          {!subs?.length && <li className="p-3 text-muted-foreground">Aucun abonnement.</li>}
        </ul>
      </section>
      <section aria-labelledby="pay-title">
        <h2 id="pay-title" className="mb-4 text-2xl font-bold">
          Paiements
        </h2>
        <ul className="divide-y divide-white/8 rounded-2xl border border-white/10 text-sm">
          {(pays ?? []).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="min-w-0 flex-1">
                {u(p.profiles)} · {formatDateFr(p.paid_at)}
              </span>
              <span className="tabular-nums">{formatPrice(p.amount_paid, p.currency)}</span>
              {p.refunded_amount > 0 && <Badge variant="pink">remboursé</Badge>}
              {p.disputed && <Badge variant="pink">litige</Badge>}
            </li>
          ))}
          {!pays?.length && <li className="p-3 text-muted-foreground">Aucun paiement.</li>}
        </ul>
      </section>
    </div>
  );
}
