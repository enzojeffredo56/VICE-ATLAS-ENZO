"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Notifications (toasts) aux couleurs Miami Neon. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface-2/95 !backdrop-blur-xl !border !border-white/10 !text-ink !rounded-2xl !font-sans !shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)]",
          description: "!text-muted-foreground",
          success: "[&_[data-icon]]:!text-turquoise",
          error: "[&_[data-icon]]:!text-pink",
          info: "[&_[data-icon]]:!text-cyan",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
