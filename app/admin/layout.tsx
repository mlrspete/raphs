import type { Metadata } from "next";
import type { ReactNode } from "react";

import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Admin | ${site.name}`,
  description: `Private admin access for ${site.name}.`,
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}
