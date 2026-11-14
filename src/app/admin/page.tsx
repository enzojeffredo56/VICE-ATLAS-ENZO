import Link from "next/link";
import { ArrowUpRight, BookOpenText, Flame, Map, Star, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SECTIONS = [
  { href: "/admin/guides", label: "Guides", text: "Créer, modifier et publier les guides.", icon: BookOpenText, phase: null },
  { href: null, label: "Lieux de la carte", text: "Gestion des lieux et catégories.", icon: Map, phase: 8 },
  { href: null, label: "Avis", text: "Modération des avis VICE ATLAS.", icon: Star, phase: 5 },
  { href: null, label: "STUNT ARENA", text: "Vidéos, concours et résultats.", icon: Flame, phase: 7 },
  { href: null, label: "Utilisateurs et rôles", text: "Comptes, rôles et sanctions.", icon: Users, phase: 8 },
  { href: null, label: "XP et badges", text: "Historique et corrections justifiées.", icon: Trophy, phase: 5 },
] as const;

export default function AdminHome() {
  return (
    <>
      <h1 className="text-4xl font-bold">Tableau de bord</h1>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ href, label, text, icon: Icon, phase }) => {
          const body = (
            <>
              <div className="flex items-start justify-between">
                <span className="grid size-11 place-items-center rounded-2xl bg-cyan/10 text-cyan">
                  <Icon className="size-5" aria-hidden />
                </span>
                {phase ? <Badge>Phase {phase}</Badge> : <ArrowUpRight className="size-5 text-pink" aria-hidden />}
              </div>
              <h2 className="mt-6 font-display text-lg font-bold">{label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </>
          );
          return (
            <li key={label}>
              {href ? (
                <Link href={href} className="glass block h-full rounded-3xl p-5 transition hover:-translate-y-1 hover:border-white/25">
                  {body}
                </Link>
              ) : (
                <div className="h-full rounded-3xl border border-dashed border-white/10 p-5 opacity-60">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
