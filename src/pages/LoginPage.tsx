import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Mail, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email address");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success("Password reset email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  // Password reset sent view
  if (showReset && resetSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
              <Mail className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                We sent a password reset link to{" "}
                <strong className="text-foreground">{email}</strong>
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to reset your password. The link expires in 1 hour.
            </p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setShowReset(false);
                setResetSent(false);
              }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Password reset form
  if (showReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-primary-foreground font-black text-xl tracking-wide">EHD</span>
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
              <p className="text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="name@sfdph.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-10 gap-2" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Send reset link
              </Button>
            </form>
          </div>

          <p className="text-center">
            <button
              type="button"
              onClick={() => setShowReset(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Default sign-in form
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-primary-foreground font-black text-xl tracking-wide">EHD</span>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Environmental Health Division</h1>
            <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@sfdph.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-10 gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium transition-colors"
          >
            Create one
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          &copy; 2026 San Francisco Department of Public Health
        </p>
      </div>
    </div>
  );
}
