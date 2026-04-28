import { NextResponse } from "next/server";
import { PaymentService } from "@/lib/payment";
import crypto from "crypto";

export async function POST(request: Request) {
  const { email, businessName, plan, sessionId, amountKobo } = await request.json();

  if (!email || !businessName || !plan || !sessionId || !amountKobo) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://purpledger.vercel.app";
  // Unique reference per transaction
  const reference = `SUB-${plan.toUpperCase()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

  try {
    const result = await PaymentService.initializeTransaction({
      email,
      amountKobo,
      reference,
      callbackUrl: `${appUrl}/onboarding/payment-callback`,
      metadata: {
        type: "subscription",
        plan,
        email,
        business_name: businessName,
        session_id: sessionId,
      },
    });

    return NextResponse.json({ authorizationUrl: result.authorizationUrl, reference });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment initialization failed";
    console.error("Payment init error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
