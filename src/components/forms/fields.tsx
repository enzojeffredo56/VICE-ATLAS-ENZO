"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import { CircleAlert, CircleCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const inputClass = (error?: string) =>
  cn(
    "h-12 w-full rounded-2xl border bg-night/70 px-4 text-ink outline-none transition placeholder:text-muted-foreground focus:ring-2",
    error ? "border-pink/70 focus:ring-pink/30" : "border-white/12 focus:border-cyan/60 focus:ring-cyan/30",
  );

export function TextField({
  name,
  label,
  error,
  hint,
  type = "text",
  ...rest
}: { name: string; label: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const id = `field-${name}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink/90">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isPassword && visible ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(inputClass(error), isPassword && "pr-12")}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-xl text-muted-foreground hover:text-white"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-pink">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className={cn("w-full", className)}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}

export function FormMessage({ ok, message }: { ok: boolean; message?: string }) {
  if (!message) return null;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2 rounded-2xl border p-3 text-sm",
        ok ? "border-turquoise/40 bg-turquoise/10 text-ink" : "border-pink/40 bg-pink/10 text-ink",
      )}
    >
      {ok ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-turquoise" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-pink" />}
      {message}
    </p>
  );
}

/** Champ piège anti-robot : invisible pour les humains et les lecteurs d'écran. */
export function HoneypotField() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="website">Ne pas remplir</label>
      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
