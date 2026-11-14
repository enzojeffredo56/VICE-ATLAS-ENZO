import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Administration VICE ATLAS" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-32 pb-16 sm:px-8">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-cyan uppercase">
        <ShieldCheck className="size-4" aria-hidden /> Administration
      </Link>
      {children}
    </div>
  );
}
