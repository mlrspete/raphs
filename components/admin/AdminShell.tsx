import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { site } from "@/lib/site";

type AdminShellProps = {
  children: ReactNode;
  adminEmail: string;
};

export function AdminShell({ children, adminEmail }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <aside className="border-b border-ink/10 bg-cream/95 px-4 py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="flex items-center justify-between gap-3 lg:block">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange">Admin</p>
            <p className="mt-1 text-xl font-black leading-tight text-ink">{site.name}</p>
          </div>
          <div className="lg:mt-6">
            <AdminSignOutButton />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto pb-1 lg:overflow-visible lg:pb-0">
          <div className="flex min-w-max gap-2 lg:grid lg:min-w-0">
            <AdminNav />
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="border-b border-ink/10 bg-white px-5 py-5 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-ink/48">Private dashboard</p>
              <h1 className="mt-1 text-2xl font-black leading-tight text-ink">Monroes Admin</h1>
            </div>
            <p className="max-w-full break-all rounded-md border border-ink/10 bg-cream px-3 py-2 text-sm font-bold text-ink/65">
              {adminEmail}
            </p>
          </div>
        </header>

        <main className="px-5 py-6 sm:px-8 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
