import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAuthState } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const authState = await getAdminAuthState();

  if (authState.status === "unauthenticated") {
    redirect("/admin/login");
  }

  if (authState.status === "denied") {
    return <AdminAccessDenied email={authState.user.email ?? null} />;
  }

  return <AdminShell adminEmail={authState.profile.email}>{children}</AdminShell>;
}
