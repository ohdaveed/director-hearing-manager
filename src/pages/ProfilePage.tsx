import { useState, useEffect } from 'react';
import { useAuth } from 'zite-auth-sdk';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, Pen, User, Mail, ShieldCheck, Users2 } from 'lucide-react';
import { saveUserSignature } from 'zite-endpoints-sdk';

// ── Signature style definitions ─────────────────────────────────────────────

export const SIGNATURE_STYLES = [
  { key: 'Style 1 — Classic',  label: 'Style 1 — Classic',  font: '"Dancing Script", cursive',  size: '26px' },
  { key: 'Style 2 — Flowing',  label: 'Style 2 — Flowing',  font: '"Great Vibes", cursive',     size: '28px' },
  { key: 'Style 3 — Formal',   label: 'Style 3 — Formal',   font: '"Pinyon Script", cursive',   size: '28px' },
  { key: 'Style 4 — Modern',   label: 'Style 4 — Modern',   font: '"Pacifico", cursive',        size: '22px' },
] as const;

export type SignatureStyleKey = typeof SIGNATURE_STYLES[number]['key'];

export function getSignatureFont(style: string | undefined): { font: string; size: string } {
  const match = SIGNATURE_STYLES.find(s => s.key === style);
  return match ? { font: match.font, size: match.size } : { font: '"Dancing Script", cursive', size: '26px' };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sigText, setSigText] = useState('');
  const [sigStyle, setSigStyle] = useState<string>('Style 1 — Classic');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setSigText(user.signatureText ?? [user.firstName, user.lastName].filter(Boolean).join(' ') ?? user.email);
      setSigStyle(user.signatureStyle ?? 'Style 1 — Classic');
    }
  }, [user]);

  const handleSave = async () => {
    if (!sigText.trim()) return;
    setSaving(true);
    try {
      await saveUserSignature({ signatureText: sigText.trim(), signatureStyle: sigStyle });
      setSaved(true);
      toast.success('Signature saved successfully');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Failed to save signature');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const initials = [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || user.email[0].toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header band */}
      <div className="bg-gradient-to-r from-primary/8 via-card to-card border-b border-border px-6 sm:px-8 py-6 flex items-center gap-4">
        <div className="w-13 h-13 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-base shrink-0 ring-2 ring-primary/25 ring-offset-2 ring-offset-card" style={{ width: 52, height: 52 }}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground leading-snug">{displayName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          {user.role && (
            <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {user.role}
            </span>
          )}
        </div>
      </div>

      <div className="px-6 sm:px-8 py-8 max-w-2xl space-y-8">

        {/* Account info (read-only) */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Account</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Full Name</p>
                <p className="text-sm text-foreground font-medium">{displayName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Email</p>
                <p className="text-sm text-foreground truncate">{user.email}</p>
              </div>
            </div>
            {user.role && (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border sm:col-span-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Role</p>
                  <p className="text-sm text-foreground font-medium">{user.role}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Signature builder */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Pen className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">My Digital Signature</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sig-text" className="text-xs font-medium text-muted-foreground">
              Signature name
            </Label>
            <Input
              id="sig-text"
              value={sigText}
              onChange={e => setSigText(e.target.value)}
              placeholder="Your full name"
              className="max-w-sm"
            />
            <p className="text-xs text-muted-foreground">This text appears as your signature on hearing packet documents.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Choose a style</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SIGNATURE_STYLES.map(style => {
                const isActive = sigStyle === style.key;
                return (
                  <button
                    key={style.key}
                    type="button"
                    onClick={() => setSigStyle(style.key)}
                    className={`text-left px-5 py-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase">{style.label}</p>
                      {isActive && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                    <p
                      className="text-foreground leading-none"
                      style={{ fontFamily: style.font, fontSize: style.size }}
                    >
                      {sigText || 'Your Name'}
                    </p>
                    <div className="border-b border-muted-foreground/25 mt-2" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleSave} disabled={saving || !sigText.trim()} className="gap-2">
              {saved ? <Check className="w-4 h-4" /> : <Pen className="w-4 h-4" />}
              {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Signature'}
            </Button>
            {!user.signatureText && (
              <p className="text-xs text-warning">
                Save your signature to enable auto-fill on hearing packets
              </p>
            )}
          </div>
        </section>

        {/* User Management — Super Admin only */}
        {user.role === 'Super Admin' && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Administration</h2>
            <button
              type="button"
              onClick={() => navigate('/user-management')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-left"
            >
              <Users2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">User Management</p>
                <p className="text-xs text-muted-foreground">Assign roles to team members</p>
              </div>
            </button>
          </section>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
