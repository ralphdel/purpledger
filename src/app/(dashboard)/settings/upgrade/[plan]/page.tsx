"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, CheckCircle2, ArrowLeft, Loader2, Building2, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UpgradePageProps {
  params: Promise<{ plan: string }>;
}

const PLAN_CONFIG: Record<string, any> = {
  individual: {
    label: "Individual",
    price: "₦5,000",
    interval: "/month",
    icon: User,
    styles: {
      card: "border-blue-200 bg-blue-50/30",
      iconWrap: "bg-blue-100 text-blue-700",
      check: "text-blue-500",
    },
    features: [
      "Unlimited Record Invoices",
      "Collection Invoices (accept payments)",
      "BVN verification for instant activation",
      "Owner + 1 team member",
      "₦5,000,000 monthly collection limit",
      "Automated email & WhatsApp reminders",
    ],
    requirements: [
      "Bank Verification Number (BVN) to enable payouts.",
      "A valid settlement bank account.",
    ],
  },
  corporate: {
    label: "Corporate",
    price: "₦20,000",
    interval: "/month",
    icon: Building2,
    styles: {
      card: "border-emerald-200 bg-emerald-50/30",
      iconWrap: "bg-emerald-100 text-emerald-700",
      check: "text-emerald-500",
    },
    features: [
      "Everything in Individual",
      "Unlimited team members",
      "Unlimited monthly collections",
      "Full business verification (CAC + BVN)",
      "Priority support",
      "Advanced audit trail",
    ],
    requirements: [
      "Corporate Affairs Commission (CAC) Registration Number and Certificate.",
      "Utility Bill (Proof of Address).",
      "Bank Verification Number (BVN).",
      "A valid corporate settlement bank account.",
    ],
  },
};

export default function UpgradePlanPage({ params }: UpgradePageProps) {
  const router = useRouter();
  const { plan } = use(params);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (plan !== "individual" && plan !== "corporate") {
    router.replace("/settings");
    return null;
  }

  const config = PLAN_CONFIG[plan];
  const Icon = config.icon;

  const handleUpgrade = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/payment/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPlan: plan }),
      });
      const data = await res.json();
      
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setError(data.error || "Failed to initialize upgrade payment.");
        setLoading(false);
      }
    } catch (e) {
      setError("An unexpected error occurred while initializing payment.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-purp-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Settings
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-purp-900">Upgrade to {config.label}</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Review the plan features and verification requirements before subscribing.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Col: Features */}
        <Card className={`border-2 shadow-none ${config.styles.card}`}>
          <CardHeader>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${config.styles.iconWrap}`}>
              <Icon className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-bold text-purp-900">{config.label} Plan</CardTitle>
            <div className="mt-2">
              <span className="text-3xl font-bold text-purp-900">{config.price}</span>
              <span className="text-sm text-neutral-500 ml-1">{config.interval}</span>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-purp-900 mb-3">What&apos;s included:</h3>
            <ul className="space-y-3">
              {config.features.map((f: string) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${config.styles.check}`} />
                  <span className="text-neutral-700">{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Right Col: Requirements & Payment */}
        <div className="space-y-6">
          <Card className="border-2 border-amber-200 shadow-none bg-amber-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-amber-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                Verification Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-800 mb-4">
                To comply with financial regulations and activate payment collection on the {config.label} tier, you must provide the following after your upgrade:
              </p>
              <ul className="space-y-2">
                {config.requirements.map((req: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-700/80 mt-4 italic">
                You can upload these documents securely from your Settings page once the upgrade is complete.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purp-200 shadow-none">
            <CardContent className="pt-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-start gap-2 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-1.5" />
                  {error}
                </div>
              )}
              
              <Button 
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full h-12 bg-purp-900 hover:bg-purp-800 text-white font-bold text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Initializing Payment...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Pay with Paystack
                  </span>
                )}
              </Button>
              <p className="text-center text-xs text-neutral-500 mt-3">
                Secured by Paystack. You will be redirected to complete your payment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
