"use client";

import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { ArrowUpRight, LogOut, NotebookPen, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { useAuth } from "./auth-provider";

export function Avatar({ url, name, className = "size-9" }: { url: string | null | undefined; name: string; className?: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- image hébergée par Supabase Storage
    <img src={url} alt="" className={`${className} rounded-full object-cover ring-2 ring-pink/50`} />
  ) : (
    <span className={`${className} grid place-items-center rounded-full bg-gradient-to-br from-pink to-violet font-display font-bold text-white uppercase ring-2 ring-pink/40`}>
      {name.slice(0, 1)}
    </span>
  );
}

/** Boutons de compte de l'en-tête (ordinateur). */
export function UserMenu() {
  const auth = useAuth();
  if (auth.status !== "authenticated") {
    return (
      <>
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href="/connexion">Connexion</Link>
        </Button>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/inscription">
            Rejoindre <ArrowUpRight />
          </Link>
        </Button>
      </>
    );
  }
  const name = auth.profile?.username ?? "Joueur";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="hidden cursor-pointer items-center gap-2 rounded-full py-1 pr-3 pl-1 transition hover:bg-white/[0.06] sm:inline-flex"
          aria-label={`Menu du compte ${name}`}
        >
          <Avatar url={auth.profile?.avatar_url} name={name} className="size-8" />
          <span className="max-w-32 truncate text-sm font-semibold">{name}</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-[70] min-w-52 rounded-2xl border border-white/10 bg-surface/95 p-1.5 shadow-2xl backdrop-blur-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <MenuLink href="/profil" icon={UserRound}>
            Mon profil
          </MenuLink>
          <MenuLink href="/carnet" icon={NotebookPen}>
            Mon carnet
          </MenuLink>
          <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
          <form action={signOutAction}>
            <DropdownMenu.Item asChild>
              <button type="submit" className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink/85 outline-none data-[highlighted]:bg-pink/15 data-[highlighted]:text-white">
                <LogOut className="size-4" aria-hidden /> Se déconnecter
              </button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuLink({ href, icon: Icon, children }: { href: string; icon: typeof LogOut; children: React.ReactNode }) {
  return (
    <DropdownMenu.Item asChild>
      <Link href={href} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink/85 outline-none data-[highlighted]:bg-white/[0.08] data-[highlighted]:text-white">
        <Icon className="size-4 text-cyan" aria-hidden /> {children}
      </Link>
    </DropdownMenu.Item>
  );
}

/** Boutons de compte du menu mobile. */
export function MobileAccountButtons({ onNavigate }: { onNavigate: () => void }) {
  const auth = useAuth();
  if (auth.status === "authenticated") {
    return (
      <>
        <Button asChild variant="outline">
          <Link href="/profil" onClick={onNavigate}>
            <UserRound /> Mon profil
          </Link>
        </Button>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" className="w-full">
            <LogOut /> Déconnexion
          </Button>
        </form>
      </>
    );
  }
  return (
    <>
      <Button asChild variant="outline">
        <Link href="/connexion" onClick={onNavigate}>
          Connexion
        </Link>
      </Button>
      <Button asChild>
        <Link href="/inscription" onClick={onNavigate}>
          Rejoindre
        </Link>
      </Button>
    </>
  );
}
