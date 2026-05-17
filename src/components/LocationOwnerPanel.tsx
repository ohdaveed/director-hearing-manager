import { useState, useEffect } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Building2,
  Save,
  Pencil,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, format, parseISO } from "date-fns";
import { locationService } from "@/services/locationService";

type GetLocationDetailOutputType = any;
type Location = GetLocationDetailOutputType["location"];

async function getLocationDetail({
  locationRecordId,
}: {
  locationRecordId: string;
}) {
  const data = await locationService.getById(locationRecordId);
  return data as any;
}
async function updateLocation(updates: any) {
  await locationService.update(updates.locationRecordId, updates);
}

function VerificationBadge({
  verificationDate,
  onVerify,
  saving,
}: {
  verificationDate?: string;
  onVerify: () => void;
  saving: boolean;
}) {
  if (!verificationDate) {
    return (
      <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30">
        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
        <span className="text-xs text-destructive flex-1">
          Owner info has never been verified
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-xs px-2 gap-1"
          onClick={onVerify}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <ShieldCheck className="w-3 h-3" />
          )}
          Verify Now
        </Button>
      </div>
    );
  }

  const days = differenceInDays(new Date(), parseISO(verificationDate));
  const isStale = days > 90;
  const formatted = format(parseISO(verificationDate), "MMM d, yyyy");

  return (
    <div
      className={`flex items-center gap-2 mt-3 p-2.5 rounded-lg border ${isStale ? "bg-warning/10 border-warning/30" : "bg-success/10 border-success/30"}`}
    >
      {isStale ? (
        <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
      )}
      <span
        className={`text-xs flex-1 ${isStale ? "text-warning" : "text-success"}`}
      >
        {isStale
          ? `⚠️ Owner info last verified ${days} days ago (${formatted}) — confirm before finalizing`
          : `Owner info verified ${formatted}`}
      </span>
      {isStale && (
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-xs px-2 gap-1"
          onClick={onVerify}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <ShieldCheck className="w-3 h-3" />
          )}
          Verify
        </Button>
      )}
    </div>
  );
}

export default function LocationOwnerPanel({
  locationRecordId,
}: {
  locationRecordId: string;
}) {
  const [loc, setLoc] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [form, setForm] = useState({
    locationId: "",
    ownerName: "",
    ownerAddress: "",
    ownerPhone: "",
    ownerEmail: "",
  });
  const [locationIdError, setLocationIdError] = useState("");

  useEffect(() => {
    setLoading(true);
    getLocationDetail({ locationRecordId })
      .then((r) => {
        setLoc(r.location);
        setForm({
          locationId: r.location.location_id ?? "",
          ownerName: r.location.owner_name ?? "",
          ownerAddress: r.location.owner_address ?? "",
          ownerPhone: r.location.owner_phone ?? "",
          ownerEmail: r.location.owner_email ?? "",
        });
      })
      .catch(() => toast.error("Failed to load location"))
      .finally(() => setLoading(false));
  }, [locationRecordId]);

  const validateLocationId = (val: string) => {
    if (!val) return "";
    const n = Number(val);
    if (!Number.isInteger(n) || n < 1 || n > 9999999) {
      return "Location ID must be a whole number between 1 and 9,999,999";
    }
    return "";
  };

  const handleLocationIdChange = (val: string) => {
    setForm((f) => ({ ...f, locationId: val }));
    setLocationIdError(validateLocationId(val));
  };

  const handleSave = async () => {
    const err = validateLocationId(form.locationId);
    if (err) {
      setLocationIdError(err);
      return;
    }

    setSaving(true);
    try {
      await updateLocation({
        locationRecordId,
        locationId: form.locationId || undefined,
        ownerName: form.ownerName || undefined,
        ownerAddress: form.ownerAddress || undefined,
        ownerPhone: form.ownerPhone || undefined,
        ownerEmail: form.ownerEmail || undefined,
      });
      setLoc((prev: any) => (prev ? { ...prev, ...form } : prev));
      setEditing(false);
      toast.success("Location saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyNow = async () => {
    setVerifying(true);
    const today = new Date().toISOString().split("T")[0];
    try {
      await updateLocation({ locationRecordId, verificationDate: today });
      setLoc((prev: any) =>
        prev ? { ...prev, verificationDate: today } : prev,
      );
      toast.success("Owner info marked as verified today");
    } catch {
      toast.error("Failed to update verification date");
    } finally {
      setVerifying(false);
    }
  };

  if (loading)
    return (
      <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading location...</span>
      </div>
    );
  if (!loc) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Owner / Property Contact
          </h3>
        </div>
        {!editing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            className="gap-1.5 h-7 text-xs"
          >
            <Pencil className="w-3 h-3" /> Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {/* Location ID — number field */}
          <div>
            <label className="text-xs text-muted-foreground">
              Location ID{" "}
              <span className="text-muted-foreground font-normal">
                (1 – 9,999,999)
              </span>
            </label>
            <Input
              type="number"
              min={1}
              max={9999999}
              step={1}
              value={form.locationId}
              onChange={(e) => handleLocationIdChange(e.target.value)}
              placeholder="e.g. 110881"
              className={`h-8 text-sm mt-0.5 ${locationIdError ? "border-destructive" : ""}`}
            />
            {locationIdError && (
              <p className="flex items-center gap-1 text-xs text-destructive mt-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {locationIdError}
              </p>
            )}
          </div>

          {[
            { key: "ownerName", label: "Owner Name" },
            { key: "ownerAddress", label: "Mailing Address" },
            { key: "ownerPhone", label: "Phone" },
            { key: "ownerEmail", label: "Email" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <Input
                value={form[key as keyof typeof form]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className="h-8 text-sm mt-0.5"
              />
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !!locationIdError}
              className="gap-1.5"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setLocationIdError("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { label: "Location ID", value: loc.location_id },
              { label: "Facility Type", value: loc.facility_type },
              { label: "Owner", value: loc.owner_name },
              { label: "Mailing Address", value: loc.owner_address },
              { label: "Phone", value: loc.owner_phone },
              { label: "Email", value: loc.owner_email },
            ].map(({ label, value }) =>
              value ? (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium text-foreground">{value}</p>
                </div>
              ) : null,
            )}
          </div>

          {/* Phase 3: Building features */}
          {loc.building_features && loc.building_features.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">
                Building Features
              </p>
              <div className="flex flex-wrap gap-1">
                {loc.building_features.map((f: any) => (
                  <Badge key={f} variant="secondary" className="text-xs">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Phase 3: Verification date with staleness warning */}
          <VerificationBadge
            verificationDate={loc.verification_date}
            onVerify={handleVerifyNow}
            saving={verifying}
          />
        </>
      )}
    </div>
  );
}
