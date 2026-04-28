import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ exists: false });

  const { data } = await supabase.auth.admin.listUsers();
  const exists = data?.users?.some((u) => u.email === email) ?? false;

  return NextResponse.json({ exists });
}
