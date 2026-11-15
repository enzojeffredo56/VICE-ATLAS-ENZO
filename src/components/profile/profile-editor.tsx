"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Camera, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar } from "@/components/auth/user-menu";
import { FormMessage, SubmitButton, TextField, inputClass } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { setAvatarAction, updateProfileAction } from "@/lib/auth/actions";
import type { FormState } from "@/lib/auth/schemas";
import { cn } from "@/lib/utils";

type Props = {
  profile: { id: string; username: string; bio: string | null; avatar_url: string | null; is_public: boolean; show_progress: boolean };
};

/** Redimensionne une image en carré 256 px (WebP) avant envoi : avatars légers, sans métadonnées. */
async function toAvatarBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const side = Math.min(bitmap.width, bitmap.height);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("conversion"))), "image/webp", 0.85));
}

export function ProfileEditor({ profile }: Props) {
  const auth = useAuth();
  const [state, action] = useActionState<FormState, FormData>(updateProfileAction, { ok: false });
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [isPublic, setIsPublic] = useState(profile.is_public);
  const [bio, setBio] = useState(profile.bio ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);

  async function onFile(file: File | undefined) {
    if (!file || !auth.supabase) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return toast.error("Choisis une image PNG, JPEG ou WebP.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image trop lourde (5 Mo maximum avant redimensionnement).");
    setUploading(true);
    try {
      const blob = await toAvatarBlob(file);
      const path = `${profile.id}/avatar-${Date.now()}.webp`;
      const { error } = await auth.supabase.storage.from("avatars").upload(path, blob, { contentType: "image/webp", upsert: false });
      if (error) throw error;
      const url = auth.supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const res = await setAvatarAction(url);
      if (!res.ok) throw new Error(res.message);
      setAvatar(url);
      toast.success("Avatar mis à jour.");
    } catch {
      toast.error("Envoi de l'avatar impossible. Réessaie avec une autre image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const e = state.fieldErrors ?? {};
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="glass flex flex-col items-center gap-4 rounded-3xl p-6 text-center">
        <div className="relative">
          <Avatar url={avatar} name={profile.username} className="size-32 text-5xl" />
          {uploading && (
            <span className="absolute inset-0 grid place-items-center rounded-full bg-night/70">
              <Loader2 className="size-8 animate-spin text-cyan" />
            </span>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" id="avatar-file" onChange={(ev) => onFile(ev.target.files?.[0])} />
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline" size="sm">
            <label htmlFor="avatar-file" className="cursor-pointer">
              <Camera /> Changer l&apos;avatar
            </label>
          </Button>
          {avatar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const res = await setAvatarAction(null);
                if (res.ok) setAvatar(null);
                toast[res.ok ? "success" : "error"](res.message ?? "");
              }}
            >
              <Trash2 /> Retirer
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">PNG, JPEG ou WebP. L&apos;image est recadrée en carré.</p>
      </div>

      <form action={action} className="glass space-y-5 rounded-3xl p-6 sm:p-8" noValidate>
        <TextField name="username" label="Pseudo" defaultValue={profile.username} maxLength={20} required error={e.username} hint="3 à 20 caractères : lettres, chiffres ou _" />
        <div className="space-y-1.5">
          <label htmlFor="bio" className="text-sm font-medium text-ink/90">
            Biographie (facultative)
          </label>
          <textarea id="bio" name="bio" value={bio} onChange={(ev) => setBio(ev.target.value)} maxLength={280} rows={3} className={cn(inputClass(e.bio), "h-auto py-3")} />
          <p className="text-right text-xs text-muted-foreground tabular-nums">{bio.length}/280</p>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Confidentialité</legend>
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 p-4">
            <input type="checkbox" name="isPublic" checked={isPublic} onChange={(ev) => setIsPublic(ev.target.checked)} className="mt-1 size-4 accent-[#FF3D91]" />
            <span>
              <span className="flex items-center gap-2 font-medium">
                {isPublic ? <Eye className="size-4 text-turquoise" /> : <EyeOff className="size-4 text-muted-foreground" />} Profil public
              </span>
              <span className="text-sm text-muted-foreground">
                Visible des autres joueurs : pseudo, avatar, biographie, niveau et badges. Désactivé, ton profil reste privé et tu n&apos;apparais pas dans les classements.
              </span>
            </span>
          </label>
          <label className={cn("flex items-start gap-3 rounded-2xl border border-white/10 p-4", !isPublic && "opacity-50")}>
            <input type="checkbox" name="showProgress" defaultChecked={profile.show_progress} disabled={!isPublic} className="mt-1 size-4 accent-[#FF3D91]" />
            <span>
              <span className="font-medium">Montrer ma progression</span>
              <span className="block text-sm text-muted-foreground">Affiche ton pourcentage de carnet sur ton profil public. Le détail reste privé.</span>
            </span>
          </label>
        </fieldset>

        <FormMessage ok={state.ok} message={state.ok ? undefined : state.message} />
        <SubmitButton className="sm:w-auto">Enregistrer</SubmitButton>
      </form>
    </div>
  );
}
