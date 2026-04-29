import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sendOnboardingWelcomeEmail } from "@/lib/brevo";

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, businessName } = await request.json();

    if (!email || !businessName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create user (triggers merchant creation)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        business_name: businessName,
        plan: "starter",
      },
    });

    if (authError && authError.status !== 422) { // 422 is already exists
      console.error("Failed to create auth user:", authError);
      return NextResponse.json({ error: "Failed to provision user" }, { status: 500 });
    }

    // Generate magic link
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const appUrl = configuredUrl || (process.env.NODE_ENV === "production" ? "https://purpledger.vercel.app" : "http://localhost:3000");

    const { data: magicLinkData, error: magicError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
        redirectTo: `${appUrl}/onboarding/set-password`,
      },
    });

    let setPasswordLink = `${appUrl}/onboarding/set-password`;

    if (magicError) {
      console.error("Failed to generate magic link:", magicError.message);
    } else if (magicLinkData?.properties?.action_link) {
      try {
        const url = new URL(magicLinkData.properties.action_link);
        url.searchParams.set("redirect_to", `${appUrl}/onboarding/set-password`);
        setPasswordLink = url.toString();
      } catch {
        setPasswordLink = magicLinkData.properties.action_link;
      }
    }

    // No session to update for Starter plan

    // Send welcome email
    try {
      await sendOnboardingWelcomeEmail(email, businessName, "starter", setPasswordLink);
    } catch (e) {
      console.error("Failed to send welcome email:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Starter provisioning failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
