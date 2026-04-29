"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Save, Shield, Upload, FileCheck, AlertTriangle, CheckCircle, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getMerchant } from "@/lib/data";
import { submitKycAction } from "@/lib/actions";
import type { Merchant } from "@/lib/types";

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [feeDefault, setFeeDefault] = useState<"business" | "customer">("business");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  // KYC state
  const [cacFile, setCacFile] = useState<File | null>(null);
  const [cacNumber, setCacNumber] = useState("");
  const [utilityFile, setUtilityFile] = useState<File | null>(null);
  const [bvnNumber, setBvnNumber] = useState("");
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycSuccess, setKycSuccess] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const handleUpgrade = async (newPlan: "individual" | "corporate") => {
    setUpgradingPlan(newPlan);
    setKycError(null);
    try {
      const res = await fetch("/api/payment/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPlan }),
      });
      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setKycError(data.error || "Failed to initialize upgrade");
        setUpgradingPlan(null);
      }
    } catch (e) {
      setKycError("An error occurred while initializing upgrade");
      setUpgradingPlan(null);
    }
  };

  useEffect(() => {
    getMerchant().then((m) => {
      if (m) {
        setMerchant(m);
        setBusinessName(m.business_name);
        setEmail(m.email);
        setPhone(m.phone || "");
        setFeeDefault(m.fee_absorption_default);
        setBvnNumber(m.bvn || "");
        setCacNumber(m.cac_number || "");
        setFeeDefault(m.fee_absorption_default);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 800);
  };

  const handleKycSubmit = async () => {
    if (!merchant) return;

    if (!cacNumber && !bvnNumber && !cacFile && !utilityFile) {
      setKycError("Please provide at least one document or number to submit verification.");
      return;
    }

    setKycSubmitting(true);

    // Simulate document upload processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const updates: any = {
      verification_status: "pending",
      kyc_submitted_at: new Date().toISOString(),
      kyc_notes: `Documents submitted: CAC=${cacFile?.name || "N/A"}, Utility=${utilityFile?.name || "N/A"}`,
    };

    if (cacNumber) updates.cac_number = cacNumber;
    if (bvnNumber) updates.bvn = bvnNumber;
    if (cacFile) {
      updates.cac_document_url = `uploaded_${cacFile.name}`;
      updates.cac_status = "pending";
    }
    if (utilityFile) {
      updates.utility_document_url = `uploaded_${utilityFile.name}`;
      updates.utility_status = "pending";
    }
    if (bvnNumber && merchant.bvn_status === "unverified") {
      updates.bvn_status = "pending";
    }
    if (cacNumber && (!merchant.cac_status || merchant.cac_status === "unverified")) {
      updates.cac_status = "pending";
    }

    const { success, error } = await submitKycAction(merchant.id, updates);

    if (success) {
      setMerchant({ ...merchant, ...updates, verification_status: "pending" as const });
      setKycSuccess(true);
      setKycError(null);
    } else {
      setKycError("Submission failed: " + error + ". Please ensure your database schema is up to date.");
    }
    setKycSubmitting(false);
  };

  const renderStatusBadge = (status: string | undefined) => {
    if (!status || status === "unverified") return null;
    if (status === "verified") return <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs ml-2"><CheckCircle className="mr-1 h-3 w-3" /> Verified</Badge>;
    if (status === "rejected") return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 text-xs ml-2"><AlertTriangle className="mr-1 h-3 w-3" /> Rejected</Badge>;
    return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs ml-2"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
  };

  const verificationStatus = merchant?.verification_status || "unverified";

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold text-purp-900">Settings</h1></div>
        <Card className="border-2 border-purp-200 shadow-none animate-pulse">
          <CardContent className="p-6"><div className="h-40 bg-purp-50 rounded" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-purp-900">Settings</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Manage your business profile and account preferences
        </p>
      </div>

      {/* ── KYC Verification Section ── */}
      <Card className={`border-2 shadow-none ${
        (merchant?.subscription_plan || merchant?.merchant_tier) === "corporate"
          ? "border-emerald-300 bg-emerald-50/30"
          : (merchant?.subscription_plan || merchant?.merchant_tier) === "individual"
          ? "border-blue-300 bg-blue-50/30"
          : "border-purp-300 bg-purp-50/30"
      }`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-purp-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-purp-700" />
              Account Verification & Limits
            </CardTitle>
            <Badge variant="outline" className={`border-2 text-xs font-semibold ${
              (merchant?.subscription_plan || merchant?.merchant_tier) === "corporate"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : (merchant?.subscription_plan || merchant?.merchant_tier) === "individual"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-neutral-50 text-neutral-600 border-neutral-200"
            }`}>
              <Shield className="mr-1 h-3 w-3" />
              Tier: <span className="capitalize ml-1">{merchant?.subscription_plan || merchant?.merchant_tier || "Starter"}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Tier Informational Banner */}
          {(merchant?.subscription_plan || merchant?.merchant_tier) === "corporate" ? (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
              {verificationStatus === "verified" ? (
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Shield className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-emerald-800">Corporate Account (Tier 2)</p>
                <p className="text-sm text-emerald-700 mt-1">
                  {verificationStatus === "verified"
                    ? "Your account is fully verified. You have access to unlimited monthly collections and payment links."
                    : "Please complete your verification below to activate your unlimited monthly collections and payment links."}
                </p>
              </div>
            </div>
          ) : (merchant?.subscription_plan || merchant?.merchant_tier) === "individual" ? (
            <div className="flex items-start justify-between gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4 flex-col md:flex-row">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Individual Account (Tier 1)</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {verificationStatus === "verified"
                      ? "Your account is verified. You can collect up to ₦5,000,000 per month. Upgrade to Corporate to unlock unlimited collections and team members."
                      : "Please complete your BVN verification below to activate your ₦5,000,000 monthly collection limit. Upgrade to Corporate to unlock unlimited collections."}
                  </p>
                </div>
              </div>
              <Link href="/settings/upgrade/corporate">
                <Button className="bg-purp-900 hover:bg-purp-800 text-white shrink-0">
                  Upgrade to Corporate
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3 p-4 bg-purp-50 border border-purp-200 rounded-lg mb-4 flex-col md:flex-row">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-purp-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-purp-900">Starter Account (Free)</p>
                  <p className="text-sm text-neutral-600 mt-1">
                    You can generate up to 10 invoices in total to test the platform. To collect live payments (₦5M/month) and unlock more invoices, upgrade your plan.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Link href="/settings/upgrade/individual">
                  <Button className="w-full sm:w-auto bg-white border border-purp-200 text-purp-900 hover:bg-purp-50">
                    Upgrade to Individual
                  </Button>
                </Link>
                <Link href="/settings/upgrade/corporate">
                  <Button className="w-full sm:w-auto bg-purp-900 hover:bg-purp-800 text-white">
                    Upgrade to Corporate
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {verificationStatus === "pending" && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Review In Progress</p>
                <p className="text-sm text-amber-700 mt-1">
                  Some of your documents are awaiting admin review. You cannot edit items that are currently pending.
                </p>
              </div>
            </div>
          )}

          {verificationStatus === "rejected" && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">Action Required</p>
                <p className="text-sm text-red-700 mt-1">
                  {merchant?.kyc_notes || "One or more of your documents were rejected. Please check the status below and re-submit."}
                </p>
              </div>
            </div>
          )}

          {kycSuccess && (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
              <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Documents Submitted!</p>
                <p className="text-sm text-emerald-700 mt-1">
                  Your verification documents have been submitted successfully. A platform admin will review them shortly.
                </p>
              </div>
            </div>
          )}

          {/* Document Upload Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-purp-700" />
                CAC Number
                {renderStatusBadge(merchant?.cac_status)}
              </Label>
              <Input
                type="text"
                placeholder="RC-123456"
                value={cacNumber}
                onChange={(e) => setCacNumber(e.target.value)}
                className="border-2 border-purp-200 bg-white h-11 max-w-xs"
                disabled={merchant?.cac_status === "verified" || merchant?.cac_status === "pending"}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-purp-700" />
                CAC Certificate
                {renderStatusBadge(merchant?.cac_status)}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setCacFile(e.target.files?.[0] || null)}
                  className="border-2 border-purp-200 bg-white h-11 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purp-100 file:text-purp-700"
                  disabled={merchant?.cac_status === "verified" || merchant?.cac_status === "pending"}
                />
                {(cacFile || merchant?.cac_document_url) && (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs whitespace-nowrap">
                    <CheckCircle className="mr-1 h-3 w-3" /> {merchant?.cac_document_url ? 'Uploaded' : 'Selected'}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-purp-700" />
                Utility Bill (Proof of Address)
                {renderStatusBadge(merchant?.utility_status)}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setUtilityFile(e.target.files?.[0] || null)}
                  className="border-2 border-purp-200 bg-white h-11 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purp-100 file:text-purp-700"
                  disabled={merchant?.utility_status === "verified" || merchant?.utility_status === "pending"}
                />
                {(utilityFile || merchant?.utility_document_url) && (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs whitespace-nowrap">
                    <CheckCircle className="mr-1 h-3 w-3" /> {merchant?.utility_document_url ? 'Uploaded' : 'Selected'}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-purp-700" />
                BVN (Bank Verification Number)
                {renderStatusBadge(merchant?.bvn_status)}
              </Label>
              <Input
                type="text"
                maxLength={11}
                placeholder="22XXXXXXXXX"
                value={bvnNumber}
                onChange={(e) => setBvnNumber(e.target.value.replace(/\D/g, ""))}
                className="border-2 border-purp-200 bg-white h-11 max-w-xs"
                disabled={merchant?.bvn_status === "verified" || merchant?.bvn_status === "pending"}
              />
            </div>
          </div>

          <Button
            onClick={handleKycSubmit}
            disabled={kycSubmitting || (!cacFile && !utilityFile && !bvnNumber && !cacNumber)}
            className="w-full h-11 bg-purp-900 hover:bg-purp-700 text-white font-semibold"
          >
            {kycSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting Documents...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Submit for Verification
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          {kycError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-1.5" />
              {kycError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Profile */}
      <Card className="border-2 border-purp-200 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-purp-900">
              Business Profile
            </CardTitle>
            <Badge variant="outline" className={`border-2 text-xs font-semibold ${
              verificationStatus === "verified"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : verificationStatus === "pending"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-neutral-50 text-neutral-600 border-neutral-200"
            }`}>
              <Shield className="mr-1 h-3 w-3" />
              {verificationStatus === "verified" ? "Verified" : verificationStatus === "pending" ? "Pending" : "Unverified"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Business Name</Label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="border-2 border-purp-200 bg-purp-50 h-11"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-2 border-purp-200 bg-purp-50 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Phone</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-2 border-purp-200 bg-purp-50 h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Business Logo</Label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purp-100 border-2 border-purp-200 border-dashed rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-purp-700">
                  {businessName.charAt(0)}
                </span>
              </div>
              <Button variant="outline" className="border-2 border-purp-200 text-purp-700">
                Upload Logo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Settings */}
      <Card className="border-2 border-purp-200 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold text-purp-900">
            Paystack Fee Settings
          </CardTitle>
          <p className="text-xs text-neutral-500 mt-1">
            Set who absorbs the Paystack processing fee by default. This can be overridden per invoice.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Global Default</Label>
            <Select value={feeDefault} onValueChange={(v) => setFeeDefault((v ?? "business") as "business" | "customer")}>
              <SelectTrigger className="border-2 border-purp-200 bg-purp-50 h-11 max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-2 border-purp-200">
                <SelectItem value="business">Business Absorbs Fee</SelectItem>
                <SelectItem value="customer">Customer Absorbs Fee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-purp-50 border border-purp-200 rounded-lg p-4 text-sm">
            <p className="text-neutral-500">
              <strong className="text-purp-900">Current Fee Structure:</strong> Paystack charges
              1.5% + ₦100 per transaction, capped at ₦2,000.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="border-2 border-purp-200 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold text-purp-900">
            Advanced Settings
          </CardTitle>
          <p className="text-xs text-neutral-500 mt-1">
            Manage your specialized platform configurations.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/settings/settlement" className="block p-4 border border-purp-200 rounded-lg hover:bg-purp-50 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-purp-900">Settlement Account</span>
                <ExternalLink className="w-4 h-4 text-purp-300 group-hover:text-purp-700 transition-colors" />
              </div>
              <p className="text-xs text-neutral-500">Configure your payout bank account for online payments.</p>
            </Link>
            
            <Link href="/settings/catalog" className="block p-4 border border-purp-200 rounded-lg hover:bg-purp-50 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-purp-900">Item Catalog</span>
                <ExternalLink className="w-4 h-4 text-purp-300 group-hover:text-purp-700 transition-colors" />
              </div>
              <p className="text-xs text-neutral-500">Manage your reusable products and services for invoicing.</p>
            </Link>

            <Link href="/settings/discount-templates" className="block p-4 border border-purp-200 rounded-lg hover:bg-purp-50 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-purp-900">Discount Templates</span>
                <ExternalLink className="w-4 h-4 text-purp-300 group-hover:text-purp-700 transition-colors" />
              </div>
              <p className="text-xs text-neutral-500">Save predefined discount rates for quick application.</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-purp-200" />

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-purp-900 hover:bg-purp-700 text-white font-semibold px-8"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

