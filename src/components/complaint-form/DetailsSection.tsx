import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
import { CheckCircle2, ClipboardList, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { INSPECTORS } from "@/utils/inspectors";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

const COMPLAINT_TYPES = [
   "Animals and Pests",
   "Housing Code Violations",
   "Vector Control",
   "Sanitation / Waste",
   "Hazardous Conditions",
   "Rodents",
   "Noise",
   "Other",
];
const METHODS = ["Email", "Phone", "In-Person", "311", "Walk-In", "Letter"];
const PROGRAMS = ["Healthy Housing and Vector Control", "Environmental Health", "Vector Control"];
const CATEGORIES = [
   "Overgrown Vegetation",
   "Rodents",
   "Pigeons",
   "Animal/Human Waste",
   "Hoarding",
   "Vector Control",
   "Other",
];

interface Props {
   hasDetails: boolean;
   complaintType: string;
   setComplaintType: (v: string) => void;
   complaintSubtype: string;
   setComplaintSubtype: (v: string) => void;
   methodReceived: string;
   setMethodReceived: (v: string) => void;
   assignedProgram: string;
   setAssignedProgram: (v: string) => void;
   dateAssigned: string;
   setDateAssigned: (v: string) => void;
   description: string;
   setDescription: (v: string) => void;
   categories: string[];
   setCategories: (v: string[]) => void;
   assignedTo: string;
   setAssignedTo: (v: string) => void;
   hasLocation: boolean;
   submitAttempted: boolean;
   touched: Record<string, boolean>;
   blurField: (field: string) => void;
}

// ... (constants and interface Props remain unchanged)

export default function DetailsSection({
  hasDetails,
  complaintType,
  setComplaintType,
  complaintSubtype,
  setComplaintSubtype,
  methodReceived,
  setMethodReceived,
  assignedProgram,
  setAssignedProgram,
  dateAssigned,
  setDateAssigned,
  description,
  setDescription,
  categories,
  setCategories,
  assignedTo,
  setAssignedTo,
  hasLocation,
  submitAttempted,
  touched,
  blurField,
}: Props) {
  return (
    <Card className="mb-4 sm:mb-6">
      <CardHeader className="flex flex-row items-center gap-2 pb-5">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${hasDetails ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          {hasDetails ? <CheckCircle2 className="w-4 h-4" /> : "3"}
        </div>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" /> Complaint Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Complaint Type + Subtype */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Complaint Type
            </Label>
            <Select value={complaintType} onValueChange={setComplaintType}>
              <SelectTrigger className="text-sm h-9">
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
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Complaint Subtype
            </Label>
            <Input
              placeholder="e.g. Animals and pests, not specified"
              value={complaintSubtype}
              onChange={(e) => setComplaintSubtype(e.target.value)}
            />
          </div>
        </div>

        {/* Method + Program */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Method Received
            </Label>
            <Select value={methodReceived} onValueChange={setMethodReceived}>
              <SelectTrigger className="text-sm h-9">
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
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Assigned Program
            </Label>
            <Select value={assignedProgram} onValueChange={setAssignedProgram}>
              <SelectTrigger className="text-sm h-9">
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
        </div>

        {/* Inspector + Date Assigned */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Assigned Inspector
            </Label>
            <Select value={assignedTo} onValueChange={setAssignedTo} disabled={!hasLocation}>
              <SelectTrigger className="text-sm h-9">
                <SelectValue
                  placeholder={hasLocation ? "Assign inspector..." : "Select location first..."}
                />
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
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Date Assigned
            </Label>
            <Input
              type="date"
              value={dateAssigned}
              onChange={(e) => setDateAssigned(e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Description of Complaint <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder="Describe the complaint in detail — include what was observed, location specifics, and any relevant history..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => blurField("description")}
            className={`min-h-[100px] resize-none transition-colors ${submitAttempted && !description.trim() ? "border-destructive" : touched.description && !description.trim() ? "border-yellow-500" : ""}`}
          />
          <AnimatePresence>
            {submitAttempted && !description.trim() && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-xs text-destructive mt-1"
              >
                <AlertCircle className="w-3 h-3" /> Description is required.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Categories */}
        <fieldset className="pt-2">
          <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Category
          </legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {CATEGORIES.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-2 cursor-pointer text-sm select-none"
              >
                <Checkbox
                  checked={categories.includes(cat)}
                  onCheckedChange={(checked) =>
                    setCategories(
                      checked ? [...categories, cat] : categories.filter((c) => c !== cat),
                    )
                  }
                />
                {cat}
              </label>
            ))}
          </div>
        </fieldset>
      </CardContent>
    </Card>
  );
}
