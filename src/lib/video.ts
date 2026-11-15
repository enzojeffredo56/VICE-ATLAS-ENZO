import { z } from "zod";

/**
 * Liens vidéo autorisés (mêmes règles que la base, private.is_allowed_video_url) :
 * YouTube (vidéo ou Shorts), clips Twitch, Streamable. Toujours en https.
 */
const VIDEO_RE = new RegExp(
  "^https://(" +
    "(www\\.|m\\.)?youtube\\.com/watch\\?v=[A-Za-z0-9_-]{11}" +
    "|(www\\.)?youtube\\.com/shorts/[A-Za-z0-9_-]{11}" +
    "|youtu\\.be/[A-Za-z0-9_-]{11}" +
    "|clips\\.twitch\\.tv/[A-Za-z0-9_-]{3,100}" +
    "|(www\\.)?twitch\\.tv/[A-Za-z0-9_]{3,25}/clip/[A-Za-z0-9_-]{3,100}" +
    "|(www\\.)?streamable\\.com/[a-z0-9]{3,12}" +
    ")([?&#][A-Za-z0-9_=&.%-]*)?$",
);

export const videoUrlSchema = z
  .string()
  .trim()
  .max(300, "Lien trop long.")
  .refine((u) => VIDEO_RE.test(u), "Lien non autorisé : utilise une vidéo YouTube, un clip Twitch ou Streamable (https).");

export const isAllowedVideoUrl = (u: string) => VIDEO_RE.test(u);

export type VideoEmbed = { provider: "youtube" | "twitch" | "streamable"; id: string; thumbnail: string | null; embedUrl: string };

/** Informations d'intégration (lecteur sans cookies pour YouTube), ou null si non reconnu. */
export function videoEmbed(url: string, parentHost = "localhost"): VideoEmbed | null {
  if (!isAllowedVideoUrl(url)) return null;
  const u = new URL(url);
  const yt = u.hostname.endsWith("youtu.be") ? u.pathname.slice(1, 12) : u.pathname.startsWith("/shorts/") ? u.pathname.slice(8, 19) : u.searchParams.get("v");
  if (yt && /youtu/.test(u.hostname)) {
    return { provider: "youtube", id: yt, thumbnail: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`, embedUrl: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0` };
  }
  if (u.hostname.includes("twitch.tv")) {
    const id = u.hostname.startsWith("clips.") ? u.pathname.slice(1) : u.pathname.split("/clip/")[1];
    return { provider: "twitch", id, thumbnail: null, embedUrl: `https://clips.twitch.tv/embed?clip=${id}&parent=${parentHost}&autoplay=true` };
  }
  const id = u.pathname.slice(1);
  return { provider: "streamable", id, thumbnail: null, embedUrl: `https://streamable.com/e/${id}?autoplay=1` };
}
