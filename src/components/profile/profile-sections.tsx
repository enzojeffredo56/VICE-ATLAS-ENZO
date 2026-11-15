import type { ReactNode } from "react";

/** Section de profil (titre + contenu) réutilisée par les phases suivantes. */
export function ProfileSection({ title, icon, children, id }: { title: string; icon?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="glass scroll-mt-28 rounded-3xl p-6 sm:p-8">
      <h2 id={id ? `${id}-title` : undefined} className="flex items-center gap-2 text-xl font-bold">
        {icon}
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
