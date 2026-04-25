"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // The Supabase generateLink 'recovery' type creates an implicit-flow link.
    // When the user clicks it, Supabase's server redirects to this page with
    // #access_token=...&type=recovery in the URL hash.
    // The Supabase client library automatically picks up the hash and fires
    // the PASSWORD_RECOVERY event via onAuthStateChange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          // Session is now active — allow the user to set a new password
          setSessionReady(true);
          setChecking(false);
          setError(null);
        } else if (event === "SIGNED_IN" && session) {
          // Handle if a valid session already existed (e.g. user refreshed the page)
          setSessionReady(true);
          setChecking(false);
          setError(null);
        }
      }
    );

    // Fallback: check if there's already an active session (e.g. user refreshed the page)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
        setChecking(false);
      } else {
        // Give onAuthStateChange time to fire from the URL hash before showing error
        // The hash processing is async, so we wait 2.5 seconds
        setTimeout(() => {
          setChecking(false);
          setSessionReady(prev => {
            if (!prev) {
              setError("Auth session missing! The link may have expired. Please request a new reset link.");
            }
            return prev;
          });
        }, 2500);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // After successful reset, log out and send to login
      await supabase.auth.signOut();
      router.push("/login?reset=success");
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  // While we wait for the PASSWORD_RECOVERY event from the URL hash, show a spinner
  if (checking) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purp-700" />
        <p className="text-neutral-500 text-sm">Verifying your reset link…</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-purp-900 tracking-tight">Create New Password</h1>
        <p className="text-neutral-500 mt-2">
          Your new password must be at least 8 characters.
        </p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
            {error}
          </div>
        )}

        {/* Only show the form if we have a valid recovery session */}
        {sessionReady && (
          <>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="focus:border-purp-700 h-12"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                className="focus:border-purp-700 h-12"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purp-900 hover:bg-purp-800 text-white h-12 text-base font-medium transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Reset Password
                </span>
              )}
            </Button>
          </>
        )}

        {/* If no session and no error yet, show a request link button */}
        {!sessionReady && !error && (
          <p className="text-center text-sm text-neutral-500">Waiting for session…</p>
        )}
      </form>
    </div>
  );
}
