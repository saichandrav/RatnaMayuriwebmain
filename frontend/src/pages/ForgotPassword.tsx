import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"request" | "reset">("request");
  const [isLoading, setIsLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const requestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to send reset code");

      // Dev mode: server returns OTP directly when email isn't configured
      if (data.devOtp) {
        setDevOtp(data.devOtp);
        setOtp(data.devOtp); // auto-fill for convenience
        toast("Dev mode — OTP auto-filled", {
          description: "Email not configured. OTP has been filled in for you.",
        });
      } else {
        toast("Reset code sent", { description: "Check your email for the 6-digit code." });
      }

      setStep("reset");
    } catch (error) {
      toast("Request failed", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to reset password");

      toast("Password updated ✓", { description: "You can now sign in with your new password." });
      navigate("/login");
    } catch (error) {
      toast("Reset failed", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Ratnamayuri</p>
          <h1 className="mt-3 text-3xl font-heading font-semibold text-foreground">
            {step === "request" ? "Forgot password?" : "Reset password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "request"
              ? "Enter your email and we'll send a verification code."
              : `Code sent to ${email}`}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8">
          {step === "request" ? (
            <form className="space-y-4" onSubmit={requestOtp}>
              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full luxury-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-70"
              >
                {isLoading ? "Sending…" : "Send reset code"}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={resetPassword}>
              {/* Dev-mode OTP banner */}
              {devOtp && (
                <div className="rounded-xl border border-amber-400/40 bg-amber-50/10 px-4 py-3 text-xs text-amber-400">
                  <span className="font-semibold">Dev mode:</span> Email not configured.
                  Your OTP is <span className="font-mono font-bold tracking-widest">{devOtp}</span>
                </div>
              )}

              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit code"
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground tracking-[0.25em] placeholder:tracking-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Create a new password"
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full luxury-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-70"
              >
                {isLoading ? "Resetting…" : "Reset password"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("request"); setDevOtp(null); setOtp(""); }}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Back to{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
};

export default ForgotPassword;
