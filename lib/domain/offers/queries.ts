import "server-only";

import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const getActiveCommerceOfferByCode = cache(async (code: string) => {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("commerce_offers")
      .select("*")
      .eq("code", code)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error(`Commerce offer lookup failed for "${code}": ${error.message}`);
      return null;
    }

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Commerce offer lookup could not run for "${code}": ${message}`);
    return null;
  }
});
