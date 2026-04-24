// PurpLedger — Database Types (matches Supabase schema)

export interface Merchant {
  id: string;
  user_id: string | null;
  workspace_code: string | null;
  business_name: string;
  email: string;
  phone: string | null;
  logo_url: string | null;
  fee_absorption_default: "business" | "customer";
  verification_status: "unverified" | "pending" | "verified" | "rejected" | "suspended";
  merchant_tier: "starter" | "individual" | "corporate";
  kyc_submitted_at: string | null;
  kyc_notes: string | null;
  cac_number: string | null;
  bvn: string | null;
  cac_document_url: string | null;
  utility_document_url: string | null;
  cac_status: "unverified" | "pending" | "verified" | "rejected";
  utility_status: "unverified" | "pending" | "verified" | "rejected";
  bvn_status: "unverified" | "pending" | "verified" | "rejected";
  monthly_collection_limit: number;
  holds_pending_review: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  merchant_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  merchant_id: string;
  client_id: string;
  invoice_number: string;
  status: "open" | "partially_paid" | "closed" | "manually_closed" | "expired" | "void";
  subtotal: number;
  discount_pct: number;
  discount_value: number;
  tax_pct: number;
  tax_value: number;
  grand_total: number;
  amount_paid: number;
  outstanding_balance: number;
  fee_absorption: "business" | "customer";
  pay_by_date: string | null;
  short_link: string | null;
  qr_code_url: string | null;
  notes: string | null;
  manual_close_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface LineItem {
  id: string;
  invoice_id: string;
  item_name: string;
  quantity: number;
  unit_rate: number;
  line_total: number;
  sort_order: number;
}

export interface Transaction {
  id: string;
  invoice_id: string;
  merchant_id: string;
  amount_paid: number;
  k_factor: number;
  tax_collected: number;
  discount_applied: number;
  paystack_fee: number;
  fee_absorbed_by: "business" | "customer";
  paystack_reference: string | null;
  payment_method: "card" | "bank_transfer" | "ussd";
  status: "success" | "failed" | "pending" | "held_pending_review";
  created_at: string;
}

export interface AuditLog {
  id: string;
  event_type: string;
  actor_id: string | null;
  actor_role: "merchant" | "admin" | "system";
  target_id: string | null;
  target_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
  is_system_role: boolean;
  created_at: string;
}

export interface MerchantTeam {
  id: string;
  merchant_id: string;
  user_id: string;
  role_id: string;
  is_active: boolean;
  invited_by: string | null;
  added_at: string;
  last_active_at: string | null;
}

// Joined types for UI convenience
export interface InvoiceWithClient extends Invoice {
  clients: Pick<Client, "full_name" | "email" | "company_name"> | null;
}

export interface InvoiceWithLineItems extends Invoice {
  line_items: LineItem[];
  clients: Pick<Client, "full_name" | "email" | "company_name"> | null;
}

export const MANUAL_CLOSE_REASONS = [
  "Settlement Discount",
  "Bad Debt Write-Off",
  "Goodwill Adjustment",
  "Duplicate Invoice",
  "Client Agreement — Paid in Full",
  "Other",
] as const;
