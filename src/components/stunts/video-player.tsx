"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { videoEmbed } from "@/lib/video";

/** Vignette cliquable : le lecteur (sans cookies pour YouTube) ne se charge qu'au clic. */
export function VideoPlayer({ url, title }: { url: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const embed = typeof window === "undefined" ? null : videoEmbed(url, window.location.hostname);
  if (!embed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="grid aspect-video place-items-center rounded-2xl bg-white/[0.04] text-sm text-cyan">
        Voir la vidéo <ExternalLink className="size-4" />
      </a>
    );
  }
  if (playing) {
    return (
      <iframe
        src={embed.embedUrl}
        title={title}
        className="aspect-video w-full rounded-2xl border border-white/10"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Lire la vidéo « ${title} »`}
      className="group relative grid aspect-video w-full cursor-pointer place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet/30 to-pink/20"
    >
      {embed.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element -- vignette fournie par la plateforme vidéo
        <img src={embed.thumbnail} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-80 transition duration-500 group-hover:scale-105" />
      )}
      <span className="relative grid size-16 place-items-center rounded-full bg-pink text-white shadow-[0_0_40px_rgb(255_61_145/0.8)] transition group-hover:scale-110">
        <Play className="size-7 fill-white" />
      </span>
    </button>
  );
}
