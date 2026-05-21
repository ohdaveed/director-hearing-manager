import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Gavel } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export type ResponsibleParty = {
  id: string;
  name: string;
  role: string;
  address: string;
  phone: string;
  email: string;
  served: boolean;
};

const CASE_STATUSES = ["Active", "NOV Issued", "Hearing Scheduled", "Hearing Held", "Closed"];
const PARTY_ROLES = ["Owner", "Manager", "Agent", "Tenant"];

export interface HearingPrepSectionProps {
  caseStatus: string;
  hearingDate: string;
  programCode: string;
  blockLot: string;
  enforcementSummary: string;
  responsibleParties: ResponsibleParty[];
  onUpdate: (field: string, value: string) => void;
  onAddParty: () => void;
  onUpdateParty: (id: string, field: keyof ResponsibleParty, value: string | boolean) => void;
  onRemoveParty: (id: string) => void;
  isSubmitted: boolean;
  onAnyChange: () => void;
}

// ... constants and types remain unchanged ...

export default function HearingPrepSection(p: HearingPrepSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-6 overflow-hidden rounded-xl border-2 border-destructive/30"
    >
      <Card className="border-0 shadow-none">
        <CardHeader className="bg-destructive/5 px-6 py-4 flex flex-row items-center gap-3">
          <Gavel className="w-5 h-5 text-destructive flex-shrink-0" />
          <div>
            <h2 className="font-semibold text-foreground text-lg">Hearing Prep</h2>
            <p className="text-xs text-muted-foreground">
              Shown because <strong>Citation to Hearing Issued</strong> is selected.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Core case info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Case Status
              </Label>
              <Select
                value={p.caseStatus}
                onValueChange={(v) => {
                  p.onUpdate("caseStatus", v);
                  p.onAnyChange();
                }}
                disabled={p.isSubmitted}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {CASE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Hearing Date
              </Label>
              <Input
                type="date"
                value={p.hearingDate}
                onChange={(e) => {
                  p.onUpdate("hearingDate", e.target.value);
                  p.onAnyChange();
                }}
                disabled={p.isSubmitted}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Program Code
              </Label>
              <Input
                placeholder="e.g. HHP-26-09"
                value={p.programCode}
                onChange={(e) => {
                  p.onUpdate("programCode", e.target.value);
                  p.onAnyChange();
                }}
                disabled={p.isSubmitted}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Block / Lot
              </Label>
              <Input
                placeholder="e.g. 1234/056"
                value={p.blockLot}
                onChange={(e) => {
                  p.onUpdate("blockLot", e.target.value);
                  p.onAnyChange();
                }}
                disabled={p.isSubmitted}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Enforcement Summary */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Enforcement Summary
            </Label>
            <p className="text-xs text-muted-foreground">
              Concise rationale for nuisance — feeds hearing packet cover and argument.
            </p>
            <Textarea
              placeholder="e.g. Repeated Sec 581(b)(13) rodents despite 3 NOVs — property remains non-compliant after 90-day notice period..."
              value={p.enforcementSummary}
              onChange={(e) => {
                p.onUpdate("enforcementSummary", e.target.value);
                p.onAnyChange();
              }}
              disabled={p.isSubmitted}
              className="min-h-[100px] resize-none text-sm"
            />
          </div>

          <Separator />

          {/* Responsible Parties */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Responsible Parties
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Populates service logs and notices for the hearing packet.
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {p.responsibleParties.length} part
                {p.responsibleParties.length !== 1 ? "ies" : "y"}
              </Badge>
            </div>

            <div className="space-y-3">
              {p.responsibleParties.map((party, i) => (
                <div
                  key={party.id}
                  className="rounded-lg border border-border bg-muted/20 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Party {i + 1}
                    </span>
                    {!p.isSubmitted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={() => p.onRemoveParty(party.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Name
                      </Label>
                      <Input
                        placeholder="Full name"
                        value={party.name}
                        onChange={(e) => {
                          p.onUpdateParty(party.id, "name", e.target.value);
                          p.onAnyChange();
                        }}
                        disabled={p.isSubmitted}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Role
                      </Label>
                      <Select
                        value={party.role}
                        onValueChange={(v) => {
                          p.onUpdateParty(party.id, "role", v);
                          p.onAnyChange();
                        }}
                        disabled={p.isSubmitted}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select role..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PARTY_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Address
                      </Label>
                      <Input
                        placeholder="Mailing address"
                        value={party.address}
                        onChange={(e) => {
                          p.onUpdateParty(party.id, "address", e.target.value);
                          p.onAnyChange();
                        }}
                        disabled={p.isSubmitted}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Phone
                      </Label>
                      <Input
                        placeholder="(415) 555-1234"
                        value={party.phone}
                        onChange={(e) => {
                          p.onUpdateParty(party.id, "phone", e.target.value);
                          p.onAnyChange();
                        }}
                        disabled={p.isSubmitted}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={party.email}
                        onChange={(e) => {
                          p.onUpdateParty(party.id, "email", e.target.value);
                          p.onAnyChange();
                        }}
                        disabled={p.isSubmitted}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox
                          id={`served-${party.id}`}
                          checked={party.served}
                          disabled={p.isSubmitted}
                          onCheckedChange={(checked) => {
                            p.onUpdateParty(party.id, "served", !!checked);
                            p.onAnyChange();
                          }}
                        />
                        <span className="text-sm font-medium">Served</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              {!p.isSubmitted && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    p.onAddParty();
                    p.onAnyChange();
                  }}
                >
                  <Plus className="w-4 h-4" /> Add Responsible Party
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
