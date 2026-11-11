"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, Loader2, CheckCircle2 } from "lucide-react";

export default function MfaEnrollPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }

      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp && factors.totp.length > 0) {
        setDone(true);
        setLoading(false);
        return;
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "FFBD Admin",
      });

      if (enrollError) {
        setError(enrollError.message);
        setLoading(false);
        return;
      }

      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setLoading(false);
    }

    init();
  }, [router, supabase.auth]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;

    setVerifying(true);
    setError(null);

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError) {
      setError(challengeError.message);
      setVerifying(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });

    if (verifyError) {
      setError("Invalid code. Make sure the time on your phone is correct.");
      setVerifying(false);
      return;
    }

    setDone(true);
    setVerifying(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF5C00]" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h1 className="font-heading text-xl font-bold mb-2">
            Authenticator Connected
          </h1>
          <p className="text-sm text-white/50 mb-6">
            Your account is now protected with 2FA. You will need the app code on every login.
          </p>
          <button
            onClick={() => router.push("/admin")}
            className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] text-white text-sm font-heading font-semibold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#FF5C00]/15 border border-[#FF5C00]/30 mb-3">
            <Shield className="w-6 h-6 text-[#FF5C00]" />
          </div>
          <h1 className="font-heading text-xl font-bold">Set up Authenticator</h1>
          <p className="text-sm text-white/50 mt-1">
            Scan the QR code with Google Authenticator, Authy, or any TOTP app
          </p>
        </div>

        <div className="bg-[#1A2332]/80 border border-white/8 rounded-2xl p-6 space-y-5">
          {qr && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt="QR Code"
                className="w-48 h-48 rounded-xl bg-white p-2"
              />
            </div>
          )}

          {secret && (
            <div className="text-center">
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-1">
                Or enter this secret manually
              </p>
              <code className="text-xs font-mono text-white/70 break-all bg-white/5 px-2 py-1 rounded">
                {secret}
              </code>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 text-center">
                Enter 6-digit code to confirm
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-center text-xl tracking-[0.4em] font-mono focus:outline-none focus:border-[#FF5C00]/50"
                placeholder="000000"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={verifying || code.length !== 6}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#FF5C00] to-[#FF8A00] text-white font-heading font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Confirm and Enable 2FA"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
