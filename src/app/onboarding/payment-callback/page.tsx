"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function PaymentCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const trxref = params.get("trxref");
  const reference = params.get("reference");
  const ref = trxref || reference;

  useEffect(() => {
    if (!ref) {
      router.replace("/");
      return;
    }
    // The webhook already handled the actual payment logic.
    // We just show a success state here and let the user know to check email.
  }, [ref, router]);

  if (!ref) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purp-50">
        <Loader2 className="w-8 h-8 animate-spin text-purp-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purp-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-10 shadow-sm border border-purp-100 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-purp-900 mb-2">Payment Received!</h1>
        <p className="text-neutral-500 text-sm mb-6">
          Your subscription is confirmed. We&apos;ve sent a welcome email to your inbox with a link to set your password and activate your account.
        </p>
        <div className="bg-purp-50 border border-purp-100 rounded-lg p-4 mb-6 text-sm text-purp-700">
          <p className="font-medium">Check your email inbox</p>
          <p className="text-xs text-purp-500 mt-1">
            The email may take 1–2 minutes to arrive. Check your spam folder if you don&apos;t see it.
          </p>
        </div>
        <Link href="/login">
          <Button className="w-full bg-purp-900 hover:bg-purp-700 text-white">
            Go to Login
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Paystack calls this URL after checkout (success or failure).
// Suspense wrapper is required because useSearchParams() is used inside.
export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-purp-50">
          <Loader2 className="w-8 h-8 animate-spin text-purp-700" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
