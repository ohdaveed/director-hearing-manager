import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Loader2,
  MapPin,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Building2,
  User,
  Calendar,
  Hash,
  Wand2,
  ExternalLink,
} from "lucide-react";
import { ALL_COMPLAINT_STATUSES } from "@/utils/complaintStatuses";
import { INSPECTORS } from "@/utils/inspectors";
import {
  useComplaintForm,
  METHODS,
  PROGRAMS,
  FACILITY_TYPES,
  CATEGORY_GROUPS,
  CLOSED_STATUSES,
  COMPLAINT_TYPES,
} from "@/hooks/useComplaintForm";

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  step,
  done,
  icon,
  title,
  optional,
}: {
  step: string | React.ReactNode;
  done: boolean;
  icon?: React.ReactNode;
  title: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
        {icon} {title}
      </h2>
      {optional && <span className="text-xs text-muted-foreground ml-1">— optional</span>}
    </div>
  );
}

function StepBar({ steps }: { steps: { label: string; done: boolean }[] }) {
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-300 ${step.done ? "bg-primary" : "bg-muted"}`}
              />
              <span
                className={`text-[10px] font-medium ${step.done ? "text-primary" : "text-muted-foreground"}`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && <div className="w-2 flex-shrink-0" />}
          </div>
        ))}
        <span className="ml-3 text-xs font-semibold tabular-nums text-primary">{pct}%</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
type Props = {
  inspectorName?: string;
  onSuccess?: () => void;
};

export default function ComplaintEntryPage({ inspectorName, onSuccess: externalOnSuccess }: Props) {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [submittedSummary, setSubmittedSummary] = useState<{
    id?: string;
    address: string;
    complaintId: string;
    assignedTo: string;
  } | null>(null);

  const {
    state,
    locationQuery,
    setLocationQuery,
    locationResults,
    selectedLocation,
    setSelectedLocation,
    creatingNewLocation,
    setCreatingNewLocation,
    isSearchingLocations,
    recentLocations,
    submitAttempted,
    isSubmitting,
    touched,
    hasLocation,
    hasComplainant,
    hasDetails,
    handleSelectLocation,
    handleCreateNew,
    blurField,
    doLocationSearch,
    onSubmit,
    fillDemoData,
    handleReset: baseHandleReset,
    setField,
    formState,
    form: { clearErrors },
  } = useComplaintForm({
    inspectorName,
    onSuccess: (summary) => {
      if (externalOnSuccess) {
        externalOnSuccess();
      } else {
        setSubmittedSummary(summary);
        setSubmitted(true);
      }
    },
  });

  const handleReset = () => {
    baseHandleReset();
    setSubmitted(false);
    setSubmittedSummary(null);
  };

  // ── Success screen (admin flow only) ─────────────────────────────────────
  if (submitted && submittedSummary) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Complaint Created</h2>
        <p className="text-muted-foreground mb-1">{submittedSummary.address}</p>
        <p className="text-sm text-muted-foreground mb-1">
          Complaint ID:{" "}
          <span className="font-mono font-semibold">{submittedSummary.complaintId}</span>
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Assigned to: {submittedSummary.assignedTo}
        </p>
        <div className="flex items-center justify-center gap-3">
          {submittedSummary.id && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate(`/complaints/${submittedSummary.id}`)}
            >
              <ExternalLink className="w-4 h-4" /> View Complaint
            </Button>
          )}
          <Button onClick={handleReset} className="gap-2">
            <Plus className="w-4 h-4" /> Create Another Complaint
          </Button>
        </div>
      </div>
    );
  }

  const steps = [
    { label: "Location", done: hasLocation },
    { label: "Complainant", done: hasComplainant },
    { label: "Details", done: hasDetails },
  ];

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Complaint Entry</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete all relevant sections from the Environmental Health Branch Complaint Form.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0 border-dashed text-muted-foreground hover:text-foreground"
          onClick={fillDemoData}
          title="Fill all fields with realistic demo data"
        >
          <Wand2 className="w-4 h-4" />
          <span className="hidden sm:inline">Fill Demo Data</span>
          <span className="sm:hidden">Demo</span>
        </Button>
      </div>

      <StepBar steps={steps} />

      {/* ── Section 1: Complaint Information ─────────────────────────────── */}
      <SectionCard>
        <SectionHeader
          step={<FileText className="w-4 h-4" />}
          done={!!state.caseNumber311 || !!state.complaintId}
          icon={undefined}
          title="Complaint Information"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              htmlFor="complaintId"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
            >
              <Hash className="w-3 h-3" /> Complaint ID
            </label>
            <Input
              id="complaintId"
              placeholder="e.g. 419076 — leave blank to auto-generate"
              value={state.complaintId}
              onChange={(e) => setField("complaintId", e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Enter the ID from the paper form, or leave blank.
            </p>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="caseNumber311"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              311 Case #
            </label>
            <Input
              id="caseNumber311"
              placeholder="e.g. 101003863368"
              value={state.caseNumber311}
              onChange={(e) => setField("caseNumber311", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="dateReceived"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Date Received
            </label>
            <Input
              id="dateReceived"
              type="date"
              value={state.dateReceived}
              onChange={(e) => setField("dateReceived", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="methodReceived"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Method Received
            </label>
            <Select
              value={state.methodReceived}
              onValueChange={(v) => setField("methodReceived", v)}
            >
              <SelectTrigger id="methodReceived" className="text-sm h-9">
                <SelectValue placeholder="How was this received?" />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="assignedProgram"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Assigned Program
            </label>
            <Select
              value={state.assignedProgram}
              onValueChange={(v) => setField("assignedProgram", v)}
            >
              <SelectTrigger id="assignedProgram" className="text-sm h-9">
                <SelectValue placeholder="Select program..." />
              </SelectTrigger>
              <SelectContent>
                {PROGRAMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="assignedTo"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Assigned Inspector
            </label>
            <Select value={state.assignedTo} onValueChange={(v) => setField("assignedTo", v)}>
              <SelectTrigger id="assignedTo" className="text-sm h-9">
                <SelectValue placeholder="Assign inspector..." />
              </SelectTrigger>
              <SelectContent>
                {INSPECTORS.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="dateAssigned"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" /> Date Assigned
            </label>
            <Input
              id="dateAssigned"
              type="date"
              value={state.dateAssigned}
              onChange={(e) => setField("dateAssigned", e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Section 2: Property Location ─────────────────────────────────── */}
      <SectionCard>
        <SectionHeader
          step="2"
          done={hasLocation}
          icon={<MapPin className="w-4 h-4 text-primary" />}
          title="Property Location"
        />
        {submitAttempted && !hasLocation && (
          <div className="flex items-center gap-1.5 text-xs text-destructive mb-3 -mt-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />A property location is required to
            save this complaint.
          </div>
        )}

        {!selectedLocation && !creatingNewLocation && (
          <div className="space-y-3">
            {/* Item #4: Recent locations */}
            {recentLocations.length > 0 && !locationQuery && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Recent Locations
                </p>
                <div className="space-y-1">
                  {recentLocations.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() =>
                        handleSelectLocation({
                          id: loc.id,
                          address: loc.address,
                          facility_type: (loc as any).facility_type,
                          owner_name: (loc as any).owner_name,
                          location_id: undefined,
                        } as any)
                      }
                      className="w-full text-left px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted transition-colors"
                    >
                      <p className="text-sm font-medium text-foreground">{loc.address}</p>
                      {((loc as any).facility_type || (loc as any).owner_name) && (
                        <p className="text-xs text-muted-foreground">
                          {[(loc as any).facility_type, (loc as any).owner_name]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="relative">
              <Input
                id="locationSearch"
                aria-label="Search by address"
                placeholder="Search by address..."
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  doLocationSearch(e.target.value);
                }}
                className="pr-9"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {isSearchingLocations ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <Search className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
            <AnimatePresence>
              {locationResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border border-border rounded-lg overflow-hidden shadow-sm"
                >
                  {locationResults.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleSelectLocation(loc)}
                      className="w-full text-left px-4 py-3 hover:bg-muted border-b border-border last:border-0 transition-colors"
                    >
                      <p className="text-sm font-medium text-foreground">{loc.address}</p>
                      <p className="text-xs text-muted-foreground">
                        {[(loc as any).facility_type, (loc as any).owner_name]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleCreateNew}>
              <Plus className="w-4 h-4" /> Create New Location
            </Button>
          </div>
        )}

        {selectedLocation && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{selectedLocation.address}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {[
                  (selectedLocation as any).facility_type,
                  (selectedLocation as any).owner_name,
                  (selectedLocation as any).location_id
                    ? `ID: ${(selectedLocation as any).location_id}`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                setSelectedLocation(null);
                setLocationQuery("");
              }}
            >
              Change
            </Button>
          </div>
        )}

        {creatingNewLocation && (
          <div className="space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">New Location Details</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setCreatingNewLocation(false)}
              >
                Cancel
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label
                  htmlFor="locAddress"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Address <span className="text-destructive">*</span>
                </label>
                <Input
                  id="locAddress"
                  placeholder="Street address"
                  value={state.locAddress}
                  onChange={(e) => {
                    setField("locAddress", e.target.value);
                  }}
                  onBlur={() => blurField("locAddress")}
                  className={touched.locAddress && !state.locAddress ? "border-destructive" : ""}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locLocationId"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Location ID
                </label>
                <Input
                  id="locLocationId"
                  placeholder="e.g. 110881"
                  value={state.locLocationId}
                  onChange={(e) => setField("locLocationId", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locBlockLot"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Block / Lot
                </label>
                <Input
                  id="locBlockLot"
                  placeholder="e.g. 1234 / 056"
                  value={state.locBlockLot}
                  onChange={(e) => setField("locBlockLot", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locFacilityType"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Facility Type
                </label>
                <Select
                  value={state.locFacilityType}
                  onValueChange={(v) => setField("locFacilityType", v)}
                >
                  <SelectTrigger id="locFacilityType" className="text-sm h-9">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locCensusTract"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Census Tract
                </label>
                <Input
                  id="locCensusTract"
                  placeholder="e.g. 027.00"
                  value={state.locCensusTract}
                  onChange={(e) => setField("locCensusTract", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locOwnerName"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                >
                  <Building2 className="w-3 h-3" /> Owner Name
                </label>
                <Input
                  id="locOwnerName"
                  placeholder="Full name"
                  value={state.locOwnerName}
                  onChange={(e) => setField("locOwnerName", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locOwnerAddress"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Owner Address
                </label>
                <Input
                  id="locOwnerAddress"
                  placeholder="Mailing address"
                  value={state.locOwnerAddress}
                  onChange={(e) => setField("locOwnerAddress", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locOwnerPhone"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" /> Owner Phone
                </label>
                <Input
                  id="locOwnerPhone"
                  placeholder="(415) 555-1234"
                  value={state.locOwnerPhone}
                  onChange={(e) => setField("locOwnerPhone", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locOwnerEmail"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" /> Owner Email
                </label>
                <Input
                  id="locOwnerEmail"
                  type="email"
                  placeholder="owner@email.com"
                  value={state.locOwnerEmail}
                  onChange={(e) => setField("locOwnerEmail", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="locNumUnits"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  # Units
                </label>
                <Input
                  id="locNumUnits"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={state.locNumUnits}
                  onChange={(e) => setField("locNumUnits", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
                  <Checkbox
                    id="locHealthyHousing"
                    checked={state.locHealthyHousing}
                    onCheckedChange={(v) => setField("locHealthyHousing", !!v)}
                  />
                  Healthy Housing Property (3+ units)
                </label>
              </div>
            </div>
          </div>
        )}

        {hasLocation && (
          <div className="pt-4 border-t border-border mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="unitNumber"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Unit #
              </label>
              <Input
                id="unitNumber"
                placeholder="e.g. 3B"
                value={state.unitNumber}
                onChange={(e) => setField("unitNumber", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="facilityName"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Facility Name
              </label>
              <Input
                id="facilityName"
                placeholder="Optional"
                value={state.facilityName}
                onChange={(e) => setField("facilityName", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="facilityOwnership"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Facility Ownership
              </label>
              <Input
                id="facilityOwnership"
                placeholder="Owner / management"
                value={state.facilityOwnership}
                onChange={(e) => setField("facilityOwnership", e.target.value)}
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Section 3: Complainant Information ───────────────────────────── */}
      <SectionCard>
        <SectionHeader
          step="3"
          done={hasComplainant}
          icon={<User className="w-4 h-4 text-primary" />}
          title="Complainant Information"
          optional
        />
        <label className="flex items-center gap-2.5 cursor-pointer select-none mb-4 p-3 rounded-lg bg-muted/50 border border-border">
          <Checkbox
            id="complainantAnonymous"
            checked={state.complainantAnonymous}
            onCheckedChange={(v) => {
              setField("complainantAnonymous", !!v);
              if (v) {
                setField("complainantName", "");
                setField("complainantPhone", "");
                setField("complainantEmail", "");
                setField("complainantAddress", "");
                setField("complainantContactDates", "");
              }
            }}
          />
          <span className="text-sm font-medium">Anonymous Complainant</span>
          {state.complainantAnonymous && (
            <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
              Anonymous ☑
            </span>
          )}
        </label>
        <AnimatePresence>
          {!state.complainantAnonymous && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label
                    htmlFor="complainantName"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                  >
                    <User className="w-3 h-3" /> Name
                  </label>
                  <Input
                    id="complainantName"
                    placeholder="Full name"
                    value={state.complainantName}
                    onChange={(e) => setField("complainantName", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="complainantPhone"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" /> Phone
                  </label>
                  <Input
                    id="complainantPhone"
                    placeholder="(415) 555-5678"
                    value={state.complainantPhone}
                    onChange={(e) => setField("complainantPhone", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="complainantEmail"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" /> Email
                  </label>
                  <Input
                    id="complainantEmail"
                    type="email"
                    placeholder="complainant@email.com"
                    value={state.complainantEmail}
                    onChange={(e) => {
                      setField("complainantEmail", e.target.value);
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!e.target.value || emailRegex.test(e.target.value))
                        clearErrors("complainantEmail");
                    }}
                    onBlur={() => blurField("complainantEmail")}
                    className={
                      touched.complainantEmail && formState.errors.complainantEmail
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {touched.complainantEmail && formState.errors.complainantEmail && (
                    <p className="text-xs text-destructive mt-1">
                      {formState.errors.complainantEmail.message as string}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label
                    htmlFor="complainantAddress"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" /> Address
                  </label>
                  <Input
                    id="complainantAddress"
                    placeholder="Mailing address"
                    value={state.complainantAddress}
                    onChange={(e) => setField("complainantAddress", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label
                    htmlFor="complainantContactDates"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1"
                  >
                    <Calendar className="w-3 h-3" /> Contact Dates
                  </label>
                  <Input
                    id="complainantContactDates"
                    placeholder="e.g. 4/2/26, 4/15/26"
                    value={state.complainantContactDates}
                    onChange={(e) => setField("complainantContactDates", e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* ── Section 4: Complaint Details ──────────────────────────────────── */}
      <SectionCard>
        <SectionHeader step="4" done={hasDetails} icon={undefined} title="Complaint Details" />
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="complaintType"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Complaint Type
              </label>
              <Select
                value={state.complaintType}
                onValueChange={(v) => setField("complaintType", v)}
              >
                <SelectTrigger id="complaintType" className="text-sm h-9">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {COMPLAINT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="complaintSubtype"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Complaint Subtype
              </label>
              <Input
                id="complaintSubtype"
                placeholder="e.g. Rodent infestation"
                value={state.complaintSubtype}
                onChange={(e) => setField("complaintSubtype", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="description"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Complaint Details / Description <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="description"
              placeholder="Describe the complaint in detail..."
              value={state.description}
              onChange={(e) => setField("description", e.target.value)}
              onBlur={() => blurField("description")}
              className={`min-h-[120px] resize-none ${submitAttempted && !state.description.trim() ? "border-destructive" : ""}`}
            />
            {submitAttempted && !state.description.trim() && (
              <p className="flex items-center gap-1 text-xs text-destructive mt-1">
                <AlertCircle className="w-3 h-3" /> Description is required.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label
              htmlFor="inspectorNotes"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Inspector Notes
            </label>
            <Textarea
              id="inspectorNotes"
              placeholder="Internal notes (not part of the complaint description)..."
              className="min-h-[72px] resize-none"
              disabled
            />
            <p className="text-[10px] text-muted-foreground">
              Inspector notes can be added via the Chronology after saving.
            </p>
          </div>
          <fieldset>
            <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Category
            </legend>
            <div className="space-y-3">
              {CATEGORY_GROUPS.map(({ group, items }) => (
                <div key={group}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                    {group}
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 pl-1">
                    {items.map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center gap-2 cursor-pointer text-sm select-none"
                      >
                        <Checkbox
                          id={cat}
                          checked={state.categories.includes(cat)}
                          onCheckedChange={(checked) =>
                            setField(
                              "categories",
                              checked
                                ? [...state.categories, cat]
                                : state.categories.filter((c) => c !== cat),
                            )
                          }
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        </div>
      </SectionCard>

      {/* ── Section 5: Complaint Status ───────────────────────────────────── */}
      <SectionCard>
        <h2 className="font-semibold text-foreground text-base mb-4">Complaint Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              htmlFor="status"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Status
            </label>
            <Select value={state.status} onValueChange={(v) => setField("status", v)}>
              <SelectTrigger id="status" className="text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_COMPLAINT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AnimatePresence>
            {CLOSED_STATUSES.includes(state.status) && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="space-y-1"
              >
                <label
                  htmlFor="inspectorNotes"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Date Closed
                </label>
                <Input
                  id="dateClosed"
                  type="date"
                  value={state.dateClosed}
                  onChange={(e) => setField("dateClosed", e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SectionCard>

      {/* ── Section 6: Hearing Information ───────────────────────────────── */}
      <SectionCard>
        <h2 className="font-semibold text-foreground text-base mb-4">
          Hearing Information (Optional)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Hearing Responsible Party
            </label>
            <Input
              placeholder="Full name of RP for hearing"
              value={state.hearing_rp_name}
              onChange={(e) => setField("hearing_rp_name", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              RP Phone
            </label>
            <Input
              placeholder="(415) 000-0000"
              value={state.hearing_rp_phone}
              onChange={(e) => setField("hearing_rp_phone", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              RP Email
            </label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={state.hearing_rp_email}
              onChange={(e) => setField("hearing_rp_email", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              RP Mailing Address
            </label>
            <Input
              placeholder="Street, City, Zip"
              value={state.hearing_rp_address}
              onChange={(e) => setField("hearing_rp_address", e.target.value)}
            />
          </div>
          <div className="col-span-full space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Purpose of Hearing
            </label>
            <Textarea
              placeholder="e.g. Failure to abate violations identified in NOV..."
              value={state.purpose_of_hearing}
              onChange={(e) => setField("purpose_of_hearing", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Notice of Hearing Date
            </label>
            <Input
              type="date"
              value={state.notice_of_hearing_date}
              onChange={(e) => setField("notice_of_hearing_date", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Hearing Order Date
            </label>
            <Input
              type="date"
              value={state.hearing_order_date}
              onChange={(e) => setField("hearing_order_date", e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-8">
        <p className="text-xs text-muted-foreground">
          <span className="text-destructive">*</span> Required fields
        </p>
        <Button size="lg" className="gap-2 px-8" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {isSubmitting ? "Saving..." : "Save Complaint"}
        </Button>
      </div>
    </div>
  );
}
