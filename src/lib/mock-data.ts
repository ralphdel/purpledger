// PurpLedger — Mock Data for MVP Development
// Structured to match the exact Supabase schema from PRD Section 5

export interface Merchant {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  logoUrl: string | null;
  feeAbsorptionDefault: "business" | "customer";
  verificationStatus: "pending" | "verified" | "suspended";
  createdAt: string;
}

export interface Client {
  id: string;
  merchantId: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string | null;
  isDeleted: boolean;
  createdAt: string;
}

export interface LineItem {
  id: string;
  invoiceId: string;
  itemName: string;
  quantity: number;
  unitRate: number;
  lineTotal: number;
  sortOrder: number;
}

export interface Invoice {
  id: string;
  merchantId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  status: "open" | "partially_paid" | "closed" | "manually_closed" | "expired" | "void";
  subtotal: number;
  discountPct: number;
  discountValue: number;
  taxPct: number;
  taxValue: number;
  grandTotal: number;
  amountPaid: number;
  outstandingBalance: number;
  feeAbsorption: "business" | "customer";
  payByDate: string;
  shortLink: string;
  qrCodeUrl: string;
  notes: string;
  manualCloseReason: string | null;
  lineItems: LineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  invoiceId: string;
  merchantId: string;
  amountPaid: number;
  kFactor: number;
  taxCollected: number;
  discountApplied: number;
  paystackFee: number;
  feeAbsorbedBy: "business" | "customer";
  paystackReference: string;
  paymentMethod: "card" | "bank_transfer" | "ussd";
  status: "success" | "failed" | "pending";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  eventType: string;
  actorId: string;
  actorRole: "merchant" | "admin";
  targetId: string;
  targetType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// === MOCK DATA ===

export const mockMerchant: Merchant = {
  id: "m-001",
  businessName: "Adewale & Partners Consulting",
  email: "ade@adewale.ng",
  phone: "+234 812 345 6789",
  logoUrl: null,
  feeAbsorptionDefault: "business",
  verificationStatus: "verified",
  createdAt: "2025-01-15T10:30:00Z",
};

export const mockClients: Client[] = [
  {
    id: "c-001", merchantId: "m-001", fullName: "Oluwaseun Bakare",
    email: "seun@techcorp.ng", phone: "+234 803 111 2222",
    companyName: "TechCorp Nigeria Ltd", isDeleted: false, createdAt: "2025-02-01T09:00:00Z",
  },
  {
    id: "c-002", merchantId: "m-001", fullName: "Chioma Okafor",
    email: "chioma@greenfields.ng", phone: "+234 805 333 4444",
    companyName: "Greenfields Agro", isDeleted: false, createdAt: "2025-02-15T14:00:00Z",
  },
  {
    id: "c-003", merchantId: "m-001", fullName: "Emeka Nwosu",
    email: "emeka@logistix.ng", phone: "+234 901 555 6666",
    companyName: "Logistix Express", isDeleted: false, createdAt: "2025-03-01T11:00:00Z",
  },
  {
    id: "c-004", merchantId: "m-001", fullName: "Fatima Ibrahim",
    email: "fatima@stategovt.ng", phone: "+234 802 777 8888",
    companyName: "Kano State Ministry of Works", isDeleted: false, createdAt: "2025-03-20T08:00:00Z",
  },
  {
    id: "c-005", merchantId: "m-001", fullName: "Dayo Afolabi",
    email: "dayo@creativestudios.ng", phone: "+234 810 999 0000",
    companyName: "Creative Studios", isDeleted: false, createdAt: "2025-04-01T16:00:00Z",
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: "inv-001", merchantId: "m-001", clientId: "c-001",
    clientName: "Oluwaseun Bakare", clientEmail: "seun@techcorp.ng",
    invoiceNumber: "INV-2025-001", status: "partially_paid",
    subtotal: 2500000, discountPct: 5, discountValue: 125000,
    taxPct: 7.5, taxValue: 178125, grandTotal: 2553125,
    amountPaid: 1000000, outstandingBalance: 1553125,
    feeAbsorption: "business", payByDate: "2025-07-15",
    shortLink: "purpledger.app/pay/inv-001", qrCodeUrl: "",
    notes: "Phase 1 consulting engagement. Payment in installments accepted.",
    manualCloseReason: null,
    lineItems: [
      { id: "li-001", invoiceId: "inv-001", itemName: "Business Strategy Consultation", quantity: 40, unitRate: 50000, lineTotal: 2000000, sortOrder: 1 },
      { id: "li-002", invoiceId: "inv-001", itemName: "Market Research Report", quantity: 1, unitRate: 500000, lineTotal: 500000, sortOrder: 2 },
    ],
    createdAt: "2025-05-01T09:30:00Z", updatedAt: "2025-06-10T14:20:00Z",
  },
  {
    id: "inv-002", merchantId: "m-001", clientId: "c-002",
    clientName: "Chioma Okafor", clientEmail: "chioma@greenfields.ng",
    invoiceNumber: "INV-2025-002", status: "open",
    subtotal: 850000, discountPct: 0, discountValue: 0,
    taxPct: 7.5, taxValue: 63750, grandTotal: 913750,
    amountPaid: 0, outstandingBalance: 913750,
    feeAbsorption: "customer", payByDate: "2025-08-01",
    shortLink: "purpledger.app/pay/inv-002", qrCodeUrl: "",
    notes: "Agricultural supply chain advisory.",
    manualCloseReason: null,
    lineItems: [
      { id: "li-003", invoiceId: "inv-002", itemName: "Supply Chain Audit", quantity: 1, unitRate: 600000, lineTotal: 600000, sortOrder: 1 },
      { id: "li-004", invoiceId: "inv-002", itemName: "Process Optimization Plan", quantity: 1, unitRate: 250000, lineTotal: 250000, sortOrder: 2 },
    ],
    createdAt: "2025-05-15T11:00:00Z", updatedAt: "2025-05-15T11:00:00Z",
  },
  {
    id: "inv-003", merchantId: "m-001", clientId: "c-003",
    clientName: "Emeka Nwosu", clientEmail: "emeka@logistix.ng",
    invoiceNumber: "INV-2025-003", status: "closed",
    subtotal: 1200000, discountPct: 10, discountValue: 120000,
    taxPct: 7.5, taxValue: 81000, grandTotal: 1161000,
    amountPaid: 1161000, outstandingBalance: 0,
    feeAbsorption: "business", payByDate: "2025-06-30",
    shortLink: "purpledger.app/pay/inv-003", qrCodeUrl: "",
    notes: "Fleet management consultation — fully paid.",
    manualCloseReason: null,
    lineItems: [
      { id: "li-005", invoiceId: "inv-003", itemName: "Fleet Analysis", quantity: 1, unitRate: 750000, lineTotal: 750000, sortOrder: 1 },
      { id: "li-006", invoiceId: "inv-003", itemName: "Route Optimization", quantity: 1, unitRate: 450000, lineTotal: 450000, sortOrder: 2 },
    ],
    createdAt: "2025-04-01T08:00:00Z", updatedAt: "2025-06-25T16:45:00Z",
  },
  {
    id: "inv-004", merchantId: "m-001", clientId: "c-004",
    clientName: "Fatima Ibrahim", clientEmail: "fatima@stategovt.ng",
    invoiceNumber: "INV-2025-004", status: "expired",
    subtotal: 5000000, discountPct: 0, discountValue: 0,
    taxPct: 7.5, taxValue: 375000, grandTotal: 5375000,
    amountPaid: 2000000, outstandingBalance: 3375000,
    feeAbsorption: "business", payByDate: "2025-05-31",
    shortLink: "purpledger.app/pay/inv-004", qrCodeUrl: "",
    notes: "Government infrastructure advisory — link expired.",
    manualCloseReason: null,
    lineItems: [
      { id: "li-007", invoiceId: "inv-004", itemName: "Infrastructure Assessment", quantity: 1, unitRate: 3000000, lineTotal: 3000000, sortOrder: 1 },
      { id: "li-008", invoiceId: "inv-004", itemName: "Regulatory Compliance ", quantity: 1, unitRate: 2000000, lineTotal: 2000000, sortOrder: 2 },
    ],
    createdAt: "2025-03-15T10:00:00Z", updatedAt: "2025-05-31T23:59:59Z",
  },
  {
    id: "inv-005", merchantId: "m-001", clientId: "c-005",
    clientName: "Dayo Afolabi", clientEmail: "dayo@creativestudios.ng",
    invoiceNumber: "INV-2025-005", status: "manually_closed",
    subtotal: 400000, discountPct: 0, discountValue: 0,
    taxPct: 7.5, taxValue: 30000, grandTotal: 430000,
    amountPaid: 415000, outstandingBalance: 15000,
    feeAbsorption: "business", payByDate: "2025-07-01",
    shortLink: "purpledger.app/pay/inv-005", qrCodeUrl: "",
    notes: "Brand identity project.",
    manualCloseReason: "Goodwill Adjustment",
    lineItems: [
      { id: "li-009", invoiceId: "inv-005", itemName: "Logo Design", quantity: 1, unitRate: 200000, lineTotal: 200000, sortOrder: 1 },
      { id: "li-010", invoiceId: "inv-005", itemName: "Brand Guidelines", quantity: 1, unitRate: 200000, lineTotal: 200000, sortOrder: 2 },
    ],
    createdAt: "2025-04-20T13:00:00Z", updatedAt: "2025-06-28T10:30:00Z",
  },
  {
    id: "inv-006", merchantId: "m-001", clientId: "c-001",
    clientName: "Oluwaseun Bakare", clientEmail: "seun@techcorp.ng",
    invoiceNumber: "INV-2025-006", status: "open",
    subtotal: 1800000, discountPct: 5, discountValue: 90000,
    taxPct: 7.5, taxValue: 128250, grandTotal: 1838250,
    amountPaid: 0, outstandingBalance: 1838250,
    feeAbsorption: "business", payByDate: "2025-09-01",
    shortLink: "purpledger.app/pay/inv-006", qrCodeUrl: "",
    notes: "Phase 2 — Digital Transformation advisory.",
    manualCloseReason: null,
    lineItems: [
      { id: "li-011", invoiceId: "inv-006", itemName: "Digital Audit", quantity: 1, unitRate: 800000, lineTotal: 800000, sortOrder: 1 },
      { id: "li-012", invoiceId: "inv-006", itemName: "Tech Stack Recommendation", quantity: 1, unitRate: 500000, lineTotal: 500000, sortOrder: 2 },
      { id: "li-013", invoiceId: "inv-006", itemName: "Implementation Roadmap", quantity: 1, unitRate: 500000, lineTotal: 500000, sortOrder: 3 },
    ],
    createdAt: "2025-06-01T09:00:00Z", updatedAt: "2025-06-01T09:00:00Z",
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: "txn-001", invoiceId: "inv-001", merchantId: "m-001",
    amountPaid: 500000, kFactor: 0.195822, taxCollected: 34884.26, discountApplied: 24478.02,
    paystackFee: 2000, feeAbsorbedBy: "business", paystackReference: "PSK_ref_001abc",
    paymentMethod: "card", status: "success", createdAt: "2025-05-15T10:30:00Z",
  },
  {
    id: "txn-002", invoiceId: "inv-001", merchantId: "m-001",
    amountPaid: 500000, kFactor: 0.195822, taxCollected: 34884.26, discountApplied: 24478.02,
    paystackFee: 2000, feeAbsorbedBy: "business", paystackReference: "PSK_ref_002def",
    paymentMethod: "bank_transfer", status: "success", createdAt: "2025-06-10T14:20:00Z",
  },
  {
    id: "txn-003", invoiceId: "inv-003", merchantId: "m-001",
    amountPaid: 600000, kFactor: 0.516795, taxCollected: 41860.40, discountApplied: 62015.40,
    paystackFee: 2000, feeAbsorbedBy: "business", paystackReference: "PSK_ref_003ghi",
    paymentMethod: "card", status: "success", createdAt: "2025-05-20T09:15:00Z",
  },
  {
    id: "txn-004", invoiceId: "inv-003", merchantId: "m-001",
    amountPaid: 561000, kFactor: 0.483205, taxCollected: 39139.60, discountApplied: 57984.60,
    paystackFee: 2000, feeAbsorbedBy: "business", paystackReference: "PSK_ref_004jkl",
    paymentMethod: "ussd", status: "success", createdAt: "2025-06-25T16:45:00Z",
  },
  {
    id: "txn-005", invoiceId: "inv-004", merchantId: "m-001",
    amountPaid: 2000000, kFactor: 0.372093, taxCollected: 139534.88, discountApplied: 0,
    paystackFee: 2000, feeAbsorbedBy: "business", paystackReference: "PSK_ref_005mno",
    paymentMethod: "bank_transfer", status: "success", createdAt: "2025-04-20T11:00:00Z",
  },
  {
    id: "txn-006", invoiceId: "inv-005", merchantId: "m-001",
    amountPaid: 415000, kFactor: 0.965116, taxCollected: 28953.49, discountApplied: 0,
    paystackFee: 2000, feeAbsorbedBy: "business", paystackReference: "PSK_ref_006pqr",
    paymentMethod: "card", status: "success", createdAt: "2025-06-15T12:00:00Z",
  },
];

// Dashboard analytics mock data
export const mockMonthlyData = [
  { month: "Jan", invoiced: 1200000, collected: 800000 },
  { month: "Feb", invoiced: 1800000, collected: 1500000 },
  { month: "Mar", invoiced: 2200000, collected: 1700000 },
  { month: "Apr", invoiced: 1600000, collected: 1400000 },
  { month: "May", invoiced: 3500000, collected: 2800000 },
  { month: "Jun", invoiced: 2900000, collected: 2100000 },
];

export const mockAgingData = [
  { bucket: "0-30 days", amount: 2752000 },
  { bucket: "31-60 days", amount: 1553125 },
  { bucket: "61-90 days", amount: 3375000 },
  { bucket: "90+ days", amount: 0 },
];

export const mockPaymentMethodData = [
  { method: "Card", value: 45, fill: "#2D1B6B" },
  { method: "Bank Transfer", value: 35, fill: "#7B2FBE" },
  { method: "USSD", value: 20, fill: "#C4B5FD" },
];

export const mockRecentActivity = [
  { id: "a-1", type: "payment", description: "Payment of ₦500,000 received for INV-2025-001", time: "2 hours ago", icon: "receipt" },
  { id: "a-2", type: "invoice", description: "Invoice INV-2025-006 created for TechCorp Nigeria", time: "5 hours ago", icon: "file" },
  { id: "a-3", type: "closure", description: "Invoice INV-2025-005 manually closed (Goodwill Adjustment)", time: "1 day ago", icon: "check" },
  { id: "a-4", type: "payment", description: "Payment of ₦561,000 received for INV-2025-003", time: "2 days ago", icon: "receipt" },
  { id: "a-5", type: "expiry", description: "Invoice INV-2025-004 expired — ₦3,375,000 outstanding", time: "3 days ago", icon: "clock" },
];

export const MANUAL_CLOSE_REASONS = [
  "Settlement Discount",
  "Bad Debt Write-Off",
  "Goodwill Adjustment",
  "Duplicate Invoice",
  "Client Agreement — Paid in Full",
  "Other",
] as const;
