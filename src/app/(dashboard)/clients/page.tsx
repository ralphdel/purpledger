"use client";

import { useState, useEffect } from "react";
import {
  Users, Search, Plus, Mail, Phone, Building2,
  Bell, BellOff, MessageCircle, AlertTriangle, Info, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getClients, getInvoices, getMerchant } from "@/lib/data";
import { formatNaira } from "@/lib/calculations";
import { createClientAction } from "@/lib/actions";
import type { Client, InvoiceWithClient } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────────
type ReminderChannel = "email" | "whatsapp" | "both" | "none";

interface FieldErrors {
  email?: string;
  whatsapp?: string;
}

// ── Helper: channel label ─────────────────────────────────────────────────────
function channelLabel(channels: ("email" | "whatsapp")[]) {
  if (channels.includes("email") && channels.includes("whatsapp")) return "Email + WhatsApp";
  if (channels.includes("email")) return "Email only";
  if (channels.includes("whatsapp")) return "WhatsApp only";
  return "";
}

// ── Helper: normalise WhatsApp number for display ─────────────────────────────
function displayWhatsApp(raw: string | null): string {
  if (!raw) return "";
  if (raw.startsWith("234") && raw.length >= 13) return "0" + raw.slice(3);
  return raw;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Core form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");

  // Reminder preference fields
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderChannel, setReminderChannel] = useState<ReminderChannel>("none");

  // Field-level errors (for reminder channel validation)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Merchant context
  const [merchantId, setMerchantId] = useState("");

  const fetchData = () => {
    setLoading(true);
    Promise.all([getClients(), getInvoices(), getMerchant()]).then(([c, i, m]) => {
      setClients(c);
      setInvoices(i);
      if (m) setMerchantId(m.id);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const filteredClients = clients.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company_name && c.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getClientStats = (clientId: string) => {
    const clientInvoices = invoices.filter((i) => i.client_id === clientId);
    const totalInvoiced = clientInvoices.reduce((s, i) => s + Number(i.grand_total), 0);
    const totalCollected = clientInvoices.reduce((s, i) => s + Number(i.amount_paid), 0);
    const outstanding = clientInvoices.reduce((s, i) => s + Number(i.outstanding_balance), 0);
    return { totalInvoiced, totalCollected, outstanding, count: clientInvoices.length };
  };

  // ── Derive channels array from the single select value ────────────────────
  const channelsArray = (): ("email" | "whatsapp")[] => {
    if (reminderChannel === "both") return ["email", "whatsapp"];
    if (reminderChannel === "email") return ["email"];
    if (reminderChannel === "whatsapp") return ["whatsapp"];
    return [];
  };

  // ── Does the current contact info satisfy the selected channel? ────────────
  const needsEmail = reminderEnabled && (reminderChannel === "email" || reminderChannel === "both");
  const needsWhatsApp = reminderEnabled && (reminderChannel === "whatsapp" || reminderChannel === "both");
  const hasBothContacts = email.trim() !== "" && whatsappNumber.trim() !== "";

  // ── Reset form ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFullName(""); setEmail(""); setPhone(""); setWhatsappNumber("");
    setCompanyName(""); setAddress("");
    setReminderEnabled(false); setReminderChannel("none");
    setSaveError(null); setFieldErrors({});
  };

  // ── Validate and save ──────────────────────────────────────────────────────
  const handleSaveClient = async () => {
    setSaveError(null);
    setFieldErrors({});

    if (!fullName.trim() || !merchantId) {
      setSaveError("Full Name is required.");
      return;
    }

    // Reminder channel validation
    const errors: FieldErrors = {};
    if (reminderEnabled) {
      if (reminderChannel === "none") {
        setSaveError("Please select at least one reminder channel (Email or WhatsApp).");
        return;
      }
      if (needsEmail && !email.trim()) {
        errors.email = "Email address is required to send email reminders.";
      }
      if (needsWhatsApp && !whatsappNumber.trim()) {
        errors.whatsapp = "WhatsApp number is required to send WhatsApp reminders.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaveError("Please fill in the highlighted fields to enable reminders.");
      return;
    }

    setSavingClient(true);
    const result = await createClientAction({
      full_name: fullName,
      email: email || undefined,
      phone: phone || undefined,
      company_name: companyName || undefined,
      address: address || undefined,
      whatsapp_number: whatsappNumber || undefined,
      reminder_enabled: reminderEnabled,
      reminder_channels: reminderEnabled ? channelsArray() : [],
      merchant_id: merchantId,
    });

    setSavingClient(false);

    if (result.success) {
      setDialogOpen(false);
      resetForm();
      fetchData();
    } else {
      setSaveError("Failed to save client: " + result.error);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-purp-900">Clients</h1></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-2 border-purp-200 shadow-none animate-pulse">
              <CardContent className="p-5"><div className="h-28 bg-purp-50 rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-purp-900">Clients</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Manage your client list and view their invoice history
          </p>
        </div>

        {/* ── Add Client Dialog ── */}
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger
            render={<Button className="bg-purp-900 hover:bg-purp-700 text-white font-semibold" />}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </DialogTrigger>

          <DialogContent className="border-2 border-purp-200 max-w-lg max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-purp-900">Add New Client</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* ── Core details ── */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="client-full-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border-2 border-purp-200 bg-purp-50 h-11"
                    placeholder="Client full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="client-company">Company Name</Label>
                    <Input
                      id="client-company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="border-2 border-purp-200 bg-purp-50 h-11"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="client-phone">Phone</Label>
                    <Input
                      id="client-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="border-2 border-purp-200 bg-purp-50 h-11"
                      placeholder="+234..."
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-purp-100" />

              {/* ── Contact details (used for reminders) ── */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-purp-700 uppercase tracking-wide">
                  Contact Details for Reminders
                </p>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="client-email"
                    className={fieldErrors.email ? "text-red-600" : ""}
                  >
                    Email Address{" "}
                    {needsEmail && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email && e.target.value.trim()) {
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }
                    }}
                    className={`border-2 bg-purp-50 h-11 transition-colors ${
                      fieldErrors.email
                        ? "border-red-400 focus:border-red-500 bg-red-50"
                        : "border-purp-200"
                    }`}
                    placeholder="client@company.ng"
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="client-whatsapp"
                    className={fieldErrors.whatsapp ? "text-red-600" : ""}
                  >
                    WhatsApp Number{" "}
                    {needsWhatsApp && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id="client-whatsapp"
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => {
                        setWhatsappNumber(e.target.value);
                        if (fieldErrors.whatsapp && e.target.value.trim()) {
                          setFieldErrors((prev) => ({ ...prev, whatsapp: undefined }));
                        }
                      }}
                      className={`border-2 bg-purp-50 h-11 transition-colors ${
                        fieldErrors.whatsapp
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-purp-200"
                      }`}
                      placeholder="e.g. 08012345678 or +2348012345678"
                    />
                  </div>
                  {fieldErrors.whatsapp && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {fieldErrors.whatsapp}
                    </p>
                  )}
                  <p className="text-xs text-neutral-400">
                    Enter local (080…) or international (+234…) format — stored automatically in international format.
                  </p>
                </div>

                {/* Friendly warning when both contacts are filled */}
                {hasBothContacts && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <strong>Please double-check these details.</strong> Both email and WhatsApp
                      will be used to send your client due-date and outstanding-payment reminders.
                      Incorrect details mean your client won&apos;t receive them.
                    </p>
                  </div>
                )}
              </div>

              <Separator className="bg-purp-100" />

              {/* ── Reminder preferences ── */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-purp-900">Send Reminders</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Automatically notify this client before and after due dates
                    </p>
                  </div>
                  {/* Toggle checkbox styled as a switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={reminderEnabled}
                      onChange={(e) => {
                        setReminderEnabled(e.target.checked);
                        if (!e.target.checked) {
                          setReminderChannel("none");
                          setFieldErrors({});
                        }
                      }}
                      className="sr-only peer"
                      id="reminder-toggle"
                    />
                    <div
                      className="w-10 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer
                        peer-checked:after:translate-x-4 after:content-[''] after:absolute
                        after:top-[2px] after:left-[2px] after:bg-white after:rounded-full
                        after:h-5 after:w-5 after:transition-all peer-checked:bg-purp-700"
                    />
                  </label>
                </div>

                {/* Channel selector — only shown when reminder is enabled */}
                {reminderEnabled && (
                  <div className="space-y-2 pl-0 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Label htmlFor="reminder-channel-select">
                      How should reminders be sent?{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={reminderChannel}
                      onValueChange={(v) => {
                        setReminderChannel(v as ReminderChannel);
                        setFieldErrors({});
                      }}
                    >
                      <SelectTrigger
                        id="reminder-channel-select"
                        className="border-2 border-purp-200 bg-purp-50 h-11"
                      >
                        <SelectValue placeholder="Select reminder channel…" />
                      </SelectTrigger>
                      <SelectContent className="border-2 border-purp-200">
                        <SelectItem value="none">— Select a channel —</SelectItem>
                        <SelectItem value="email">
                          <span className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-purp-700" />
                            Email only
                          </span>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <span className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-emerald-600" />
                            WhatsApp only
                          </span>
                        </SelectItem>
                        <SelectItem value="both">
                          <span className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-purp-700" />
                            Both Email &amp; WhatsApp
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Channel-specific contact requirement hints */}
                    {reminderChannel !== "none" && (
                      <div className="space-y-1.5 mt-1">
                        {needsEmail && !email.trim() && (
                          <p className="text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded px-2 py-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Fill in the <strong>Email Address</strong> above to send email reminders.
                          </p>
                        )}
                        {needsWhatsApp && !whatsappNumber.trim() && (
                          <p className="text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded px-2 py-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Fill in the <strong>WhatsApp Number</strong> above to send WhatsApp reminders.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator className="bg-purp-100" />

              {/* ── Address ── */}
              <div className="space-y-1.5">
                <Label htmlFor="client-address">Address <span className="text-neutral-400 font-normal">(optional)</span></Label>
                <Textarea
                  id="client-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value.slice(0, 300))}
                  className="border-2 border-purp-200 bg-purp-50 min-h-[72px] resize-none"
                  placeholder="Street, city, state…"
                />
                <p className="text-xs text-neutral-400 text-right">{address.length}/300</p>
              </div>
            </div>

            {/* Form-level error */}
            {saveError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                {saveError}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setDialogOpen(false); resetForm(); }}
                className="border-2 border-purp-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveClient}
                disabled={!fullName.trim() || savingClient}
                className="bg-purp-900 hover:bg-purp-700 text-white font-semibold"
              >
                {savingClient ? "Saving…" : "Save Client"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <Input
          placeholder="Search clients…"
          className="pl-10 border-2 border-purp-200 bg-white focus:border-purp-700"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Client Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const stats = getClientStats(client.id);
          return (
            <Card
              key={client.id}
              className="border-2 border-purp-200 shadow-none hover:border-purp-700 transition-colors"
            >
              <CardContent className="p-5">
                {/* Name + Company */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-purp-100 border-2 border-purp-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-purp-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-purp-900 truncate">{client.full_name}</h3>
                      {/* Reminder badge */}
                      {client.reminder_enabled && client.reminder_channels?.length > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-purp-200 text-purp-700 bg-purp-50 px-1.5 py-0.5 shrink-0"
                        >
                          <Bell className="w-2.5 h-2.5 mr-0.5" />
                          {channelLabel(client.reminder_channels)}
                        </Badge>
                      )}
                      {client.reminder_enabled === false && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-neutral-200 text-neutral-400 px-1.5 py-0.5 shrink-0"
                        >
                          <BellOff className="w-2.5 h-2.5 mr-0.5" />
                          No reminders
                        </Badge>
                      )}
                    </div>
                    {client.company_name && (
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 shrink-0" />
                        {client.company_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 text-sm mb-4">
                  {client.email && (
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.whatsapp_number && (
                    <div className="flex items-center gap-2 text-neutral-500">
                      <MessageCircle className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{displayWhatsApp(client.whatsapp_number)}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-2 text-neutral-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-xs">{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t-2 border-purp-200">
                  <div>
                    <p className="text-xs text-neutral-500">Invoiced</p>
                    <p className="text-sm font-bold text-purp-900">{formatNaira(stats.totalInvoiced)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Collected</p>
                    <p className="text-sm font-bold text-emerald-600">{formatNaira(stats.totalCollected)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Outstanding</p>
                    <p className="text-sm font-bold text-amber-600">{formatNaira(stats.outstanding)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-16 text-neutral-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-neutral-500">No clients found</p>
          <p className="text-sm mt-1">
            {searchQuery ? "Try a different search term." : "Add your first client to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
