import "server-only";

import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const getCampaignBySlug = cache(async (slug: string) => {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.from("promo_campaigns").select("*").eq("slug", slug).maybeSingle();

    if (error) {
      console.error(`Campaign lookup failed for "${slug}": ${error.message}`);
      return null;
    }

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Campaign lookup could not run for "${slug}": ${message}`);
    return null;
  }
});
