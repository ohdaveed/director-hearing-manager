import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

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
              <Label htmlFor="password">Password</Label>
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

        <p className="text-center text-xs text-muted-foreground">
          © 2026 San Francisco Department of Public Health
        </p>
      </div>
    </div>
  );
}
