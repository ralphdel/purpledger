import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { PaymentService } from "@/lib/payment";

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";

  // ── Signature verification via PaymentService (not raw crypto) ──────────────
  const verification = PaymentService.verifyWebhook(body, signature);
  if (process.env.NODE_ENV === "production" && !verification.valid) {
    console.error("Webhook signature invalid:", verification.error);
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);

  // Only process charge.success events
  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const { metadata, amount, reference, channel } = event.data;
  const paymentType: string = metadata?.type ?? "invoice_payment";

  // ── Branch: subscription payment vs invoice payment ──────────────────────
  if (paymentType === "subscription") {
    return handleSubscriptionPayment(metadata, amount, reference);
  }

  return handleInvoicePayment(metadata, amount, reference, channel);
}

// ── Subscription Payment Handler ─────────────────────────────────────────────
// Fires when a merchant pays for their Individual or Corporate plan on the landing page.

async function handleSubscriptionPayment(
  metadata: Record<string, unknown>,
  amount: number,
  reference: string
) {
  const sessionId = metadata?.session_id as string | undefined;
  const plan = metadata?.plan as "individual" | "corporate" | undefined;
  const email = metadata?.email as string | undefined;
  const businessName = metadata?.business_name as string | undefined;

  if (!sessionId || !plan || !email || !businessName) {
    console.error("Subscription webhook missing required metadata:", metadata);
    return NextResponse.json({ received: true });
  }

  // Idempotency: check if this reference was already processed
  const { data: existingSession } = await supabase
    .from("onboarding_sessions")
    .select("id, status, merchant_id")
    .eq("idempotency_key", reference)
    .single();

  if (existingSession?.status === "payment_confirmed" || existingSession?.status === "activated") {
    console.log("Duplicate subscription webhook, skipping:", reference);
    return NextResponse.json({ received: true });
  }

  // 1. Create Supabase auth user (email only, no password — they'll set it via magic link)
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    // If user already exists (e.g. existing Starter upgrading), don't fail
    if (!authError?.message?.includes("already")) {
      console.error("Failed to create auth user:", authError?.message);
      return NextResponse.json({ error: "User creation failed" }, { status: 500 });
    }
  }

  const userId = authUser?.user?.id;

  // 2. Create merchants row
  const { data: merchant, error: merchantError } = await supabase
    .from("merchants")
    .insert({
      user_id: userId ?? null,
      email,
      business_name: businessName,
      subscription_plan: plan,
      verification_status: "unverified",
      fee_absorption_default: "business",
      monthly_collection_limit: plan === "individual" ? 5000000 : 0,
    })
    .select("id")
    .single();

  if (merchantError || !merchant) {
    console.error("Failed to create merchant:", merchantError?.message);
    return NextResponse.json({ error: "Merchant creation failed" }, { status: 500 });
  }

  // 3. Update onboarding_sessions record
  await supabase
    .from("onboarding_sessions")
    .update({
      status: "payment_confirmed",
      paystack_ref: reference,
      amount_paid: amount / 100, // kobo → NGN
      merchant_id: merchant.id,
      idempotency_key: reference,
    })
    .eq("id", sessionId);

  // 4. Generate a Supabase magic link for the set-password page
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://purpledger.vercel.app";
  const { data: magicLinkData, error: magicError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${appUrl}/onboarding/set-password`,
    },
  });

  if (magicError || !magicLinkData?.properties?.action_link) {
    console.error("Failed to generate magic link:", magicError?.message);
    // Don't fail — user can use 'Resend activation email' page
  }

  // 5. Send welcome + set-password email via Brevo
  try {
    const { sendOnboardingWelcomeEmail } = await import("@/lib/brevo");
    await sendOnboardingWelcomeEmail(
      email,
      businessName,
      plan,
      magicLinkData?.properties?.action_link ?? `${appUrl}/onboarding/resend`
    );
  } catch (e) {
    console.error("Failed to send welcome email:", e);
  }

  // 6. Log to audit
  await supabase.from("audit_logs").insert({
    event_type: "subscription_payment_confirmed",
    actor_id: null,
    actor_role: "system",
    target_id: merchant.id,
    target_type: "merchant",
    metadata: {
      actor_name: "System (Paystack Webhook)",
      plan,
      reference,
      amount_ngn: amount / 100,
    },
  });

  console.log(`✅ Subscription confirmed: ${email} → ${plan} plan — ${reference}`);
  return NextResponse.json({ received: true });
}

// ── Invoice Payment Handler ───────────────────────────────────────────────────
// Fires when a client pays a Collection Invoice via the payment portal.

async function handleInvoicePayment(
  metadata: Record<string, unknown>,
  _amount: number,
  reference: string,
  channel: string
) {
  const invoiceId: string = metadata?.invoice_id as string;
  const paymentAmount: number = metadata?.payment_amount as number;

  if (!invoiceId || !paymentAmount) {
    console.error("Webhook missing invoice_id or payment_amount in metadata");
    return NextResponse.json({ received: true });
  }

  // Idempotency: skip if already processed
  const { data: existingTxn } = await supabase
    .from("transactions")
    .select("id")
    .eq("paystack_reference", reference)
    .single();

  if (existingTxn) {
    console.log("Duplicate invoice webhook, skipping:", reference);
    return NextResponse.json({ received: true });
  }

  // Fetch current invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (invoiceError || !invoice) {
    console.error("Invoice not found:", invoiceId);
    return NextResponse.json({ received: true });
  }

  // Only process Collection Invoices via webhook
  if (invoice.invoice_type === "record") {
    console.error("Webhook received for Record Invoice — rejected:", invoiceId);
    return NextResponse.json({ received: true });
  }

  const currentOutstanding = Number(invoice.outstanding_balance);
  const currentAmountPaid = Number(invoice.amount_paid);
  const newAmountPaid = currentAmountPaid + paymentAmount;
  const newOutstanding = Math.max(0, currentOutstanding - paymentAmount);
  const newStatus = newOutstanding <= 0 ? "closed" : "partially_paid";

  // Update invoice balances
  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      amount_paid: newAmountPaid,
      outstanding_balance: newOutstanding,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  if (updateError) {
    console.error("Failed to update invoice:", updateError);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // Calculate proportional fields
  const kFactor =
    Number(metadata?.k_factor) ||
    (currentOutstanding > 0 ? paymentAmount / currentOutstanding : 0);
  const taxCollected = Math.round(kFactor * Number(invoice.tax_value) * 100) / 100;
  const discountApplied = Math.round(kFactor * Number(invoice.discount_value) * 100) / 100;
  const rawFee = paymentAmount * 0.015 + 100;
  const paystackFee = invoice.fee_absorption === "customer" ? Math.min(rawFee, 2000) : 0;
  const paymentMethod =
    channel === "card" ? "card" : channel === "bank" ? "bank_transfer" : "ussd";

  // Record transaction
  await supabase.from("transactions").insert({
    invoice_id: invoiceId,
    merchant_id: invoice.merchant_id,
    amount_paid: paymentAmount,
    k_factor: kFactor,
    tax_collected: taxCollected,
    discount_applied: discountApplied,
    paystack_fee: paystackFee,
    fee_absorbed_by: invoice.fee_absorption || "business",
    payment_method: paymentMethod,
    paystack_reference: reference,
    status: "success",
  });

  // Record payment_event
  await supabase.from("payment_events").insert({
    merchant_id: invoice.merchant_id,
    invoice_id: invoiceId,
    event_type: "charge.success",
    processor: "paystack",
    processor_ref: reference,
    amount_kobo: Math.round(paymentAmount * 100),
    raw_payload: metadata,
    idempotency_key: reference,
  });

  // Audit log
  await supabase.from("audit_logs").insert({
    event_type: "payment_received",
    actor_id: null,
    actor_role: "system",
    target_id: invoiceId,
    target_type: "invoice",
    metadata: {
      actor_merchant_id: invoice.merchant_id,
      actor_name: "System (Paystack Webhook)",
      amount: paymentAmount,
      reference,
    },
  });

  // Send receipt email
  const { data: fullInvoice } = await supabase
    .from("invoices")
    .select("*, clients(email, full_name)")
    .eq("id", invoiceId)
    .single();

  if (fullInvoice?.clients?.email) {
    const { sendPaymentReceiptEmail } = await import("@/lib/brevo");
    const { formatNaira } = await import("@/lib/calculations");
    const { data: merchantData } = await supabase
      .from("merchants")
      .select("business_name")
      .eq("id", invoice.merchant_id)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://purpledger.vercel.app";

    await sendPaymentReceiptEmail(
      fullInvoice.clients.email,
      fullInvoice.clients.full_name || "Valued Client",
      merchantData?.business_name || "PurpLedger Merchant",
      invoice.invoice_number,
      formatNaira(paymentAmount),
      formatNaira(newOutstanding),
      invoice.pay_by_date
        ? new Date(invoice.pay_by_date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : null,
      `${appUrl}/pay/${invoice.id}`
    ).catch((e) => console.error("Failed to send receipt email:", e));
  }

  console.log(`✅ Payment recorded: ${reference} — ₦${paymentAmount} on invoice ${invoiceId}`);
  return NextResponse.json({ received: true });
}
