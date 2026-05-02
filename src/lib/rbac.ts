import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

export async function requirePermission(merchantId: string, requiredPermission: string): Promise<{ permitted: boolean, error?: string }> {
  try {
    const sb = await createClient();
    const { data: { session } } = await sb.auth.getSession();
    const user = session?.user;

    if (!user) {
      return { permitted: false, error: "Unauthorized: No active session" };
    }

    // Check if owner
    const { data: merchant } = await sb
      .from("merchants")
      .select("user_id")
      .eq("id", merchantId)
      .single();

    if (merchant?.user_id === user.id) {
      return { permitted: true }; // Owner has all permissions
    }

    // Check role in merchant_team
    const { data: teamData } = await sb
      .from("merchant_team")
      .select("roles(permissions)")
      .eq("merchant_id", merchantId)
      .eq("user_id", user.id)
      .single();

    if (!teamData || !teamData.roles) {
      return { permitted: false, error: "Unauthorized: You are not a member of this team" };
    }

    // @ts-ignore
    const permissions = teamData.roles.permissions as Record<string, boolean>;

    if (!permissions || permissions[requiredPermission] !== true) {
      return { permitted: false, error: `Forbidden: You do not have the '${requiredPermission}' permission` };
    }

    return { permitted: true };
  } catch (err: any) {
    return { permitted: false, error: err.message || "An error occurred checking permissions" };
  }
}
