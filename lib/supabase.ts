/**
 * Re-export the Supabase admin client for use in the auth system.
 * Single import point so API routes don't need to know the internal path.
 */
export { createSupabaseAdminClient } from "./supabase/admin-client";
