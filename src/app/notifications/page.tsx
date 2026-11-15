import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { markNotificationsReadAction } from "@/lib/community/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/text";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-32 pb-16 sm:px-8">
      <h1 className="flex items-center gap-3 text-4xl font-bold">
        <Bell className="size-8 text-pink" aria-hidden /> Notifications
      </h1>
      <Suspense fallback={<Skeleton className="mt-8 h-64 rounded-3xl" />}>
        <List />
      </Suspense>
    </div>
  );
}

async function List() {
  const empty = <EmptyState className="mt-8" icon={Bell} title="Rien de neuf" description="Tes XP, badges et résultats de modération apparaîtront ici." />;
  if (!isSupabaseConfigured) return empty;
  const sb = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/connexion?suite=/notifications");
  const { data } = await sb.from("notifications").select("id,kind,title,body,link,read_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  if (!data?.length) return empty;
  return (
    <>
      <form action={async () => {
        "use server";
        await markNotificationsReadAction();
      }} className="mt-6 text-right">
        <Button type="submit" variant="ghost" size="sm">
          <CheckCheck /> Tout marquer comme lu
        </Button>
      </form>
      <ul className="mt-2 space-y-2">
        {data.map((n) => {
          const body = (
            <>
              <span className="flex items-center gap-2 font-semibold">
                {!n.read_at && <span className="size-2 rounded-full bg-pink" aria-label="Non lue" />}
                {n.title}
              </span>
              {n.body && <span className="mt-0.5 block text-sm text-ink/80">{n.body}</span>}
              <span className="mt-1 block text-xs text-muted-foreground">{formatDateFr(n.created_at)}</span>
            </>
          );
          const cls = cn("block rounded-2xl border p-4 transition", n.read_at ? "border-white/8 bg-white/[0.02]" : "border-pink/30 bg-pink/[0.06]");
          return <li key={n.id}>{n.link ? <Link href={n.link} className={cn(cls, "hover:border-white/25")}>{body}</Link> : <div className={cls}>{body}</div>}</li>;
        })}
      </ul>
    </>
  );
}
