"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AdminSignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center rounded-md border border-ink/10 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-ink transition hover:bg-peach focus:outline-none focus:ring-4 focus:ring-orange/25 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={loading}
      onClick={handleSignOut}
      type="button"
    >
      {loading ? "Signing out" : "Sign out"}
    </button>
  );
}
