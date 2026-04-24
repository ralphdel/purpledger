"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Building2, Phone } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await registerUser(formData);
      if (result.success) {
        // Redirect to dashboard, the trigger will have set up the merchant account.
        router.push("/dashboard");
      } else {
        setError(result.error || "Failed to create account.");
      }
    });
  };

  return (
    <div>
      <div className="lg:hidden flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-purp-900 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">P</span>
        </div>
        <span className="text-xl font-bold text-purp-900">PurpLedger</span>
      </div>

      <h1 className="text-2xl font-bold text-purp-900">Create your account</h1>
      <p className="mt-2 text-neutral-500">Start invoicing smarter in under 2 minutes</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName" className="text-sm font-medium text-neutral-900">
            Business Name
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              name="businessName"
              id="businessName"
              type="text"
              placeholder="Adewale & Partners Consulting"
              className="pl-10 h-11 border-2 border-purp-200 bg-purp-50 focus:border-purp-700"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-neutral-900">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              name="email"
              id="email"
              type="email"
              placeholder="ade@business.ng"
              className="pl-10 h-11 border-2 border-purp-200 bg-purp-50 focus:border-purp-700"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-neutral-900">
            Phone Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              name="phone"
              id="phone"
              type="tel"
              placeholder="+234 812 345 6789"
              className="pl-10 h-11 border-2 border-purp-200 bg-purp-50 focus:border-purp-700"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-neutral-900">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              name="password"
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className="pl-10 pr-10 h-11 border-2 border-purp-200 bg-purp-50 focus:border-purp-700"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-purp-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200 font-medium text-center">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 bg-purp-900 hover:bg-purp-700 text-white font-semibold mt-2"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating account...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Create Account
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="text-purp-700 hover:underline font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
