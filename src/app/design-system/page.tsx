import type { Metadata } from "next";
import { DesignSystemDemo } from "./demo";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return <DesignSystemDemo />;
}
