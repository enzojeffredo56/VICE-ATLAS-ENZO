"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useActionState, useState } from "react";
import { Gift, Star } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { FormMessage, HoneypotField, SubmitButton, inputClass } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/auth/schemas";
import { submitReviewAction } from "@/lib/reviews/actions";
import { cn } from "@/lib/utils";

const LABELS = ["", "Décevant", "Moyen", "Correct", "Très bien", "Excellent"];

export function ReviewForm({ existing }: { existing?: { rating: number; comment: string; status: string } | null }) {
  const auth = useAuth();
  const [state, action] = useActionState<FormState, FormData>(submitReviewAction, { ok: false });
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const shown = hover || rating;
  const e = state.fieldErrors ?? {};

  if (auth.status === "anonymous") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-ink/85">Connecte-toi pour donner ton avis sur VICE ATLAS.</p>
        <div className="flex justify-center gap-2">
          <Button asChild>
            <Link href="/connexion?suite=/avis">Se connecter</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/inscription">Créer un compte</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="relative space-y-5" noValidate>
      <HoneypotField />
      <p className="flex items-start gap-3 rounded-2xl border border-pink/30 bg-pink/10 p-4 text-sm">
        <Gift className="mt-0.5 size-4 shrink-0 text-pink" aria-hidden />
        <span>
          <strong>Participation récompensée :</strong> +20 XP une seule fois, après vérification de ton avis,{" "}
          <strong>quelle que soit ta note</strong>. Les critiques respectueuses sont publiées comme les autres.
        </span>
      </p>
      {existing && (
        <p className="text-sm text-muted-foreground">
          Tu as déjà donné ton avis ({existing.status === "approved" ? "publié" : existing.status === "pending" ? "en cours de vérification" : "non publié"}). Tu peux le
          modifier : il repassera en vérification.
        </p>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Ta note</legend>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Note sur 5" onPointerLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.label key={n} whileHover={{ scale: 1.2, rotate: 10 }} whileTap={{ scale: 0.9 }} className="cursor-pointer p-1" onPointerEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" aria-label={`${n} étoile${n > 1 ? "s" : ""}`} />
              <Star
                className={cn(
                  "size-9 transition-all peer-focus-visible:outline-2 peer-focus-visible:outline-cyan",
                  n <= shown ? "fill-pink text-pink drop-shadow-[0_0_10px_rgb(255_61_145/0.7)]" : "text-ink/25",
                )}
                aria-hidden
              />
            </motion.label>
          ))}
          <span className="ml-3 text-sm text-muted-foreground" aria-live="polite">
            {LABELS[shown]}
          </span>
        </div>
        {e.rating && (
          <p role="alert" className="mt-1 text-xs text-pink">
            {e.rating}
          </p>
        )}
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="comment" className="text-sm font-medium">
          Ton commentaire sur VICE ATLAS
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={5}
          maxLength={1000}
          value={comment}
          onChange={(ev) => setComment(ev.target.value)}
          placeholder="Ce qui te plaît, ce qui manque, ce que tu changerais…"
          aria-invalid={Boolean(e.comment)}
          className={cn(inputClass(e.comment), "h-auto py-3")}
        />
        <div className="flex justify-between text-xs">
          <span className={cn(comment.trim().length < 30 ? "text-muted-foreground" : "text-turquoise")}>
            {comment.trim().length < 30 ? `Encore ${30 - comment.trim().length} caractères minimum` : "Longueur suffisante"}
          </span>
          <span className="text-muted-foreground tabular-nums">{comment.length}/1000</span>
        </div>
        {e.comment && (
          <p role="alert" className="text-xs text-pink">
            {e.comment}
          </p>
        )}
      </div>

      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton className="sm:w-auto">{existing ? "Modifier mon avis" : "Publier mon avis"}</SubmitButton>
    </form>
  );
}
