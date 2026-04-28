"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Mail, MessageCircle, Bell, Info } from "lucide-react";
import { createClientAction, updateClientAction } from "@/lib/actions";
import type { Client } from "@/lib/types";
import { useEffect } from "react";

type ReminderChannel = "email" | "whatsapp" | "both" | "none";

interface FieldErrors {
  email?: string;
  whatsapp?: string;
}

interface CreateClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (client: Client) => void;
  merchantId: string;
  clientToEdit?: Client | null;
}

export function CreateClientModal({ open, onOpenChange, onSuccess, merchantId, clientToEdit }: CreateClientModalProps) {
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

  useEffect(() => {
    if (open) {
      if (clientToEdit) {
        setFullName(clientToEdit.full_name || "");
        setEmail(clientToEdit.email || "");
        setPhone(clientToEdit.phone || "");
        setWhatsappNumber(clientToEdit.whatsapp_number || "");
        setCompanyName(clientToEdit.company_name || "");
        setAddress(clientToEdit.address || "");
        setReminderEnabled(clientToEdit.reminder_enabled || false);
        
        let channel: ReminderChannel = "none";
        if (clientToEdit.reminder_channels && clientToEdit.reminder_channels.length > 0) {
          if (clientToEdit.reminder_channels.includes("email") && clientToEdit.reminder_channels.includes("whatsapp")) {
            channel = "both";
          } else if (clientToEdit.reminder_channels.includes("email")) {
            channel = "email";
          } else if (clientToEdit.reminder_channels.includes("whatsapp")) {
            channel = "whatsapp";
          }
        }
        setReminderChannel(channel);
      } else {
        resetForm();
      }
    }
  }, [open, clientToEdit]);

  const channelsArray = (): ("email" | "whatsapp")[] => {
    if (reminderChannel === "both") return ["email", "whatsapp"];
    if (reminderChannel === "email") return ["email"];
    if (reminderChannel === "whatsapp") return ["whatsapp"];
    return [];
  };

  const needsEmail = reminderEnabled && (reminderChannel === "email" || reminderChannel === "both");
  const needsWhatsApp = reminderEnabled && (reminderChannel === "whatsapp" || reminderChannel === "both");
  const hasBothContacts = email.trim() !== "" && whatsappNumber.trim() !== "";

  const resetForm = () => {
    setFullName(""); setEmail(""); setPhone(""); setWhatsappNumber("");
    setCompanyName(""); setAddress("");
    setReminderEnabled(false); setReminderChannel("none");
    setSaveError(null); setFieldErrors({});
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) resetForm();
  };

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
    let result;
    if (clientToEdit) {
      result = await updateClientAction(clientToEdit.id, {
        full_name: fullName,
        email: email || undefined,
        phone: phone || undefined,
        company_name: companyName || undefined,
        address: address || undefined,
        whatsapp_number: whatsappNumber || undefined,
        reminder_enabled: reminderEnabled,
        reminder_channels: reminderEnabled ? channelsArray() : [],
      });
    } else {
      result = await createClientAction({
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
    }

    setSavingClient(false);

    if (result.success && result.data) {
      resetForm();
      if (onSuccess) onSuccess(result.data as Client);
      else onOpenChange(false);
    } else {
      setSaveError("Failed to save client: " + result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-2 border-purp-200 max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-purp-900">{clientToEdit ? "Edit Client" : "Add New Client"}</DialogTitle>
          <DialogDescription className="sr-only">Fill out the details to {clientToEdit ? "edit the" : "add a new"} client.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ── Core details ── */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border-2 border-purp-200 bg-purp-50 h-11"
                placeholder="Client full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Company Name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="border-2 border-purp-200 bg-purp-50 h-11"
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
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
              <Label className={fieldErrors.email ? "text-red-600" : ""}>
                Email Address {needsEmail && <span className="text-red-500">*</span>}
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email && e.target.value.trim()) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                className={`border-2 bg-purp-50 h-11 transition-colors ${
                  fieldErrors.email ? "border-red-400 focus:border-red-500 bg-red-50" : "border-purp-200"
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
              <Label className={fieldErrors.whatsapp ? "text-red-600" : ""}>
                WhatsApp Number {needsWhatsApp && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative">
                <Input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => {
                    setWhatsappNumber(e.target.value);
                    if (fieldErrors.whatsapp && e.target.value.trim()) {
                      setFieldErrors((prev) => ({ ...prev, whatsapp: undefined }));
                    }
                  }}
                  className={`border-2 bg-purp-50 h-11 transition-colors ${
                    fieldErrors.whatsapp ? "border-red-400 focus:border-red-500 bg-red-50" : "border-purp-200"
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
                Enter local (080…) or international (+234…) format.
              </p>
            </div>

            {/* Friendly warning when both contacts are filled */}
            {hasBothContacts && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Please double-check these details.</strong> Both email and WhatsApp
                  will be used to send your client due-date and outstanding-payment reminders.
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
                />
                <div
                  className="w-10 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer
                    peer-checked:after:translate-x-4 after:content-[''] after:absolute
                    after:top-[2px] after:left-[2px] after:bg-white after:rounded-full
                    after:h-5 after:w-5 after:transition-all peer-checked:bg-purp-700"
                />
              </label>
            </div>

            {/* Channel selector */}
            {reminderEnabled && (
              <div className="space-y-2 pl-0 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label>How should reminders be sent? <span className="text-red-500">*</span></Label>
                <Select
                  value={reminderChannel}
                  onValueChange={(v) => {
                    setReminderChannel(v as ReminderChannel);
                    setFieldErrors({});
                  }}
                >
                  <SelectTrigger className="border-2 border-purp-200 bg-purp-50 h-11">
                    <SelectValue placeholder="Select reminder channel…" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-purp-200">
                    <SelectItem value="none">— Select a channel —</SelectItem>
                    <SelectItem value="email">
                      <span className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-purp-700" /> Email only
                      </span>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <span className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-600" /> WhatsApp only
                      </span>
                    </SelectItem>
                    <SelectItem value="both">
                      <span className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-purp-700" /> Both Email &amp; WhatsApp
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
            <Label>Address <span className="text-neutral-400 font-normal">(optional)</span></Label>
            <Textarea
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
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="border-2 border-purp-200">
            Cancel
          </Button>
          <Button onClick={handleSaveClient} disabled={!fullName.trim() || savingClient} className="bg-purp-900 hover:bg-purp-700 text-white font-semibold">
            {savingClient ? "Saving…" : clientToEdit ? "Save Changes" : "Save Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
