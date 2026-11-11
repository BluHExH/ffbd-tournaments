"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, Loader2, KeyRound } from "lucide-react";

type Step = "password" | "mfa";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      const { data: adminRow, error: adminError } = await supabase
        .from("admins")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (adminError || !adminRow) {
        await supabase.auth.signOut();
        setError("You are not authorized as an admin.");
        setLoading(false);
        return;
      }

      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const totpFactor = factorsData?.totp?.[0];

      if (!totpFactor) {
        router.push("/admin/mfa");
        router.refresh();
        return;
      }

      setFactorId(totpFactor.id);
      setStep("mfa");
      setLoading(false);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;

    setLoading(true);
    setError(null);

    try {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        setError(challengeError.message);
        setLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: otp.trim(),
      });

      if (verifyError) {
        setError("Invalid authenticator code. Try again.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Verification failed. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1221] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FF5C00]/15 border border-[#FF5C00]/30 mb-4">
            <Shield className="w-7 h-7 text-[#FF5C00]" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
            Admin Panel
          </h1>
          <p className="mt-1.5 text-sm text-white/50">BANGLAR TOURNAMENTS</p>
        </div>

        <div className="bg-[#1A2332]/80 border border-white/8 rounded-2xl p-6 sm:p-8 backdrop-blur">
          {step === "password" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5C00]/60 focus:ring-1 focus:ring-[#FF5C00]/40 transition"
                  placeholder="admin@ffbd.gg"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5C00]/60 focus:ring-1 focus:ring-[#FF5C00]/40 transition"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] text-white font-heading font-semibold text-sm tracking-wide hover:opacity-95 active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaVerify} className="space-y-5">
              <div className="text-center mb-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-3">
                  <KeyRound className="w-5 h-5 text-[#FF5C00]" />
                </div>
                <p className="text-sm text-white/70">
                  Enter the 6-digit code from your Authenticator app
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider text-center">
                  Authenticator Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-12 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-center text-xl tracking-[0.4em] font-mono placeholder:text-white/20 focus:outline-none focus:border-[#FF5C00]/60 focus:ring-1 focus:ring-[#FF5C00]/40 transition"
                  placeholder="000000"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] text-white font-heading font-semibold text-sm tracking-wide hover:opacity-95 active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify and Continue"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("password");
                  setOtp("");
                  setError(null);
                  supabase.auth.signOut();
                }}
                className="w-full text-sm text-white/40 hover:text-white/70 transition"
              >
                Back to login
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          Authorized admins only · MFA required · Max 3 accounts
        </p>
      </div>
    </div>
  );
}
