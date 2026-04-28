// PurpLedger — WATI WhatsApp Integration Stub
// Sprint A: No-op stub. Flip ENABLE_WHATSAPP_REMINDERS=true in Sprint E.
// Sprint E: Replace this file with full WATI REST API implementation.

const ENABLED = process.env.ENABLE_WHATSAPP_REMINDERS === "true";

export interface WATITemplateParam {
  name: string;
  value: string;
}

/**
 * Send a WhatsApp template message via WATI.
 * Currently a no-op until ENABLE_WHATSAPP_REMINDERS=true and WATI credentials are set.
 *
 * @param phone International format without '+', e.g. '2348012345678'
 * @param templateName WATI template name (must be Meta-approved)
 * @param params Template variable substitutions
 */
export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  params: WATITemplateParam[]
): Promise<{ success: boolean; error?: string }> {
  if (!ENABLED) {
    console.log(
      `[WATI] WhatsApp reminders disabled. Skipping ${templateName} to ${phone}.`
    );
    return { success: true };
  }

  const apiUrl = process.env.WATI_API_URL;
  const apiToken = process.env.WATI_API_TOKEN;

  if (!apiUrl || !apiToken) {
    console.error("[WATI] WATI_API_URL or WATI_API_TOKEN not set.");
    return { success: false, error: "WATI credentials not configured" };
  }

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/sendTemplateMessage?whatsappNumber=${phone}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_name: templateName,
          broadcast_name: `purpledger_${templateName}_${Date.now()}`,
          parameters: params,
        }),
      }
    );

    if (res.status === 429) {
      // Rate limit — log and return gracefully, do not throw
      console.warn(`[WATI] Rate limited sending ${templateName} to ${phone}. Skipping.`);
      return { success: false, error: "Rate limited" };
    }

    const json = await res.json();

    if (!res.ok) {
      console.error(`[WATI] Error sending ${templateName} to ${phone}:`, json);
      return { success: false, error: json?.message ?? "Unknown WATI error" };
    }

    console.log(`[WATI] Sent ${templateName} to ${phone}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "WATI fetch failed";
    console.error(`[WATI] Exception:`, message);
    return { success: false, error: message };
  }
}

/**
 * Normalise a Nigerian phone number to international format for WhatsApp.
 * Input: 08012345678 or +2348012345678 or 2348012345678
 * Output: 2348012345678
 */
export function normaliseWhatsAppNumber(input: string): string {
  // Strip all non-digits
  let digits = input.replace(/\D/g, "");

  // Handle local format (starts with 0)
  if (digits.startsWith("0") && digits.length === 11) {
    digits = "234" + digits.slice(1);
  }

  return digits;
}
