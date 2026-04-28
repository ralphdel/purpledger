"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, User, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

interface OnboardingPageProps {
  params: Promise<{ plan: string }>;
}

const PLAN_CONFIG = {
  individual: {
    label: "Individual",
    price: "₦5,000/month",
    priceKobo: 500000,
    features: [
      "Unlimited Record + Collection Invoices",
      "BVN verification for payment links",
      "PurpBot AI financial insights",
      "Automated reminders + monthly report",
      "Owner + 1 team member",
      "₦5M monthly collection limit",
    ],
  },
  corporate: {
    label: "Corporate",
    price: "₦20,000/month",
    priceKobo: 2000000,
    features: [
      "Everything in Individual",
      "Unlimited team members",
      "Unlimited collections — no limit",
      "Full business verification (CAC + BVN + Utility)",
      "Priority support",
    ],
  },
};

export default function OnboardingPlanPage({ params }: OnboardingPageProps) {
  const router = useRouter();
  const { plan } = use(params);
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate plan
  if (plan !== "individual" && plan !== "corporate") {
    router.replace("/onboarding");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purp-700" />
      </div>
    );
  }

  const config = PLAN_CONFIG[plan];
  const Icon = plan === "corporate" ? Building2 : User;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Check if email already has an account
      const checkRes = await fetch("/api/onboarding/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const checkData = await checkRes.json();

      if (checkData.exists) {
        setError("This email already has an account. Log in to upgrade your plan.");
        setLoading(false);
        return;
      }

      // 2. Create onboarding session
      const sessionRes = await fetch("/api/onboarding/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, businessName, plan }),
      });
      const sessionData = await sessionRes.json();

      if (!sessionData.sessionId) {
        setError("Failed to create session. Please try again.");
        setLoading(false);
        return;
      }

      // 3. Initialize Paystack subscription payment
      const payRes = await fetch("/api/onboarding/initialize-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          businessName,
          plan,
          sessionId: sessionData.sessionId,
          amountKobo: config.priceKobo,
        }),
      });
      const payData = await payRes.json();

      if (!payData.authorizationUrl) {
        setError("Failed to initialize payment. Please try again.");
        setLoading(false);
        return;
      }

      // 4. Redirect to Paystack checkout
      window.location.href = payData.authorizationUrl;
    } catch (err: unknown) {
      setError("Something went wrong. Please try again.");
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-purp-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <Link
          href="/onboarding"
          className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-purp-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Plans
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left — Plan summary */}
          <div className="bg-purp-900 rounded-2xl p-8 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-purp-300 text-sm font-medium uppercase tracking-wider">
                    PurpLedger
                  </p>
                  <h1 className="text-xl font-bold">{config.label} Plan</h1>
                </div>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold">{config.price}</span>
                <p className="text-purp-300 text-sm mt-1">
                  PurpLedger absorbs the Paystack processing fee
                </p>
              </div>
              <ul className="space-y-3">
                {config.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-purp-100">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-purp-400 text-xs mt-8">
              Payment links require identity verification after setup. Free to verify.
            </p>
          </div>

          {/* Right — Intent capture form */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-purp-100">
            <h2 className="text-2xl font-bold text-purp-900 mb-2">Get Started</h2>
            <p className="text-neutral-500 text-sm mb-6">
              Enter your details to proceed to secure payment.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Adebayo Consulting"
                  required
                  className="h-11 border-2 border-purp-200 focus:border-purp-700"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  required
                  className="h-11 border-2 border-purp-200 focus:border-purp-700"
                />
                <p className="text-xs text-neutral-400">
                  Your login email. No password needed here — you&apos;ll set it after payment.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-purp-900 hover:bg-purp-700 text-white font-semibold text-base mt-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Pay {config.price} Securely
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-purp-100 text-center">
              <p className="text-sm text-neutral-500">
                Want the free plan instead?{" "}
                <Link href="/register" className="text-purp-700 font-medium hover:underline">
                  Start with Starter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
