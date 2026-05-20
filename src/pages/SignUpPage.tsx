import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, UserPlus, ArrowLeft, Mail } from "lucide-react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Confirmation email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
                We sent a confirmation link to <strong className="text-foreground">{email}</strong>
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to confirm your account, then sign in.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn't receive it? Check your spam folder or{" "}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                try again
              </button>
            </p>
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/login">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-primary-foreground font-black text-xl tracking-wide">EHD</span>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
            <p className="text-sm text-muted-foreground">
              Join the Environmental Health Division workspace
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-[11px] text-muted-foreground">At least 6 characters</p>
            </div>
            <Button type="submit" className="w-full h-10 gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          &copy; 2026 San Francisco Department of Public Health
        </p>
      </div>
    </div>
  );
}
