"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

/** Cloche avec le nombre de notifications non lues (actualisé en temps réel). */
export function NotificationBell() {
  const auth = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    const sb = auth.supabase;
    const load = async () => {
      const { count } = await sb.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id).is("read_at", null);
      setUnread(count ?? 0);
    };
    void load();
    const channel = sb
      .channel(`notifications-${auth.user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${auth.user.id}` }, () => void load())
      .subscribe();
    return () => void sb.removeChannel(channel);
  }, [auth]);

  if (auth.status !== "authenticated") return null;
  return (
    <Link href="/notifications" aria-label={unread ? `${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}` : "Notifications"} className="relative grid size-10 place-items-center rounded-full text-ink/80 transition hover:bg-white/[0.07] hover:text-white">
      <Bell className="size-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-pink px-1 text-[11px] font-bold text-white shadow-[0_0_12px_rgb(255_61_145/0.8)]">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
