import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from "lucide-react";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-1 text-xs text-destructive mt-1"
    >
      {message}
    </motion.p>
  );
}

interface Props {
  hasComplainantInfo: boolean;
  anonymous: boolean;
  setAnonymous: (v: boolean) => void;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  contactDates: string;
  setContactDates: (v: string) => void;
  touched: Record<string, boolean>;
  formErrors: Record<string, string>;
  blurField: (field: string) => void;
  clearError: (field: string) => void;
}

function validateEmail(email: string) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ComplainantSection({
  hasComplainantInfo,
  anonymous,
  setAnonymous,
  name,
  setName,
  phone,
  setPhone,
  email,
  setEmail,
  address,
  setAddress,
  contactDates,
  setContactDates,
  touched,
  formErrors,
  blurField,
  clearError,
}: Props) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex items-center gap-2 mb-5">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${hasComplainantInfo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          {hasComplainantInfo ? <CheckCircle2 className="w-4 h-4" /> : "4"}
        </div>
        <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Complainant Information
        </h2>
        <span className="text-xs text-muted-foreground ml-1">— optional</span>
      </div>

      {/* Anonymous toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none mb-4 p-3 rounded-lg bg-muted/50 border border-border">
        <Checkbox
          checked={anonymous}
          onCheckedChange={(v) => setAnonymous(!!v)}
        />
        <span className="text-sm font-medium text-foreground">
          Anonymous Complainant
        </span>
        {anonymous && (
          <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
            Anonymous ☑
          </span>
        )}
      </label>

      <AnimatePresence>
        {!anonymous && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <User className="w-3 h-3" /> Complainant Name
                </label>
                <Input
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone Number
                </label>
                <Input
                  placeholder="(415) 555-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <Input
                  type="email"
                  placeholder="complainant@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validateEmail(e.target.value))
                      clearError("complainantEmail");
                  }}
                  onBlur={() => blurField("complainantEmail")}
                  className={
                    touched.complainantEmail && formErrors.complainantEmail
                      ? "border-destructive"
                      : ""
                  }
                />
                <AnimatePresence>
                  {touched.complainantEmail && formErrors.complainantEmail && (
                    <FieldError message={formErrors.complainantEmail} />
                  )}
                </AnimatePresence>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Complainant Address
                </label>
                <Input
                  placeholder="Mailing address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Contact Dates
                </label>
                <Input
                  placeholder="e.g. 4/2/26, 4/15/26"
                  value={contactDates}
                  onChange={(e) => setContactDates(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
