import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  highlight,
  description,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: string;
  /** Mots du titre à afficher en dégradé néon. */
  highlight?: string[];
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl space-y-4", align === "center" && "mx-auto text-center", className)}>
      <Reveal>
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-cyan uppercase">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-cyan" aria-hidden />
          {eyebrow}
        </p>
      </Reveal>
      <h2 className="text-4xl leading-[1.02] font-bold sm:text-5xl lg:text-6xl">
        <SplitText
          text={title}
          wordClassName={(w) => (highlight?.includes(w.replace(/[.,!?]/g, "")) ? "text-neon" : undefined)}
        />
      </h2>
      {description && (
        <Reveal delay={0.15}>
          <p className="text-base text-muted-foreground sm:text-lg">{description}</p>
        </Reveal>
      )}
    </div>
  );
}
