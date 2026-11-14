import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-display font-semibold tracking-tight transition-[transform,box-shadow,background-color,color,border-color] duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-pink to-violet text-white shadow-[0_0_0_1px_rgb(255_255_255/0.08)_inset,0_10px_30px_-10px_rgb(255_61_145/0.8)] hover:shadow-[0_0_0_1px_rgb(255_255_255/0.15)_inset,0_14px_40px_-8px_rgb(255_61_145/0.95)]",
        cyan: "bg-cyan text-night shadow-[0_10px_30px_-10px_rgb(0_212_255/0.8)] hover:shadow-[0_14px_40px_-8px_rgb(0_212_255/0.95)] hover:bg-[#33ddff]",
        outline:
          "border border-white/15 bg-white/[0.03] text-ink backdrop-blur hover:border-cyan/60 hover:bg-cyan/10 hover:text-white",
        ghost: "text-ink/80 hover:bg-white/[0.06] hover:text-white",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        link: "text-cyan underline-offset-4 hover:underline rounded-md",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        default: "h-11 px-5 text-sm",
        lg: "h-13 px-7 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
