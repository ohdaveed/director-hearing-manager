import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, CheckCircle2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { saveHearingOrder, GetHearingPacketDataOutputType } from 'zite-endpoints-sdk';
import { HearingOrderData, PacketHearingOrder } from '@/components/packet/PacketHearingOrder';

type Props = {
  packet: GetHearingPacketDataOutputType['packet'];
  complaint: GetHearingPacketDataOutputType['complaint'];
  location: GetHearingPacketDataOutputType['location'];
  inspections: GetHearingPacketDataOutputType['inspections'];
};

const DETERMINATION_OPTIONS = ['upheld', 'dismissed', 'modified'] as const;
const PARTY_ROLES = ['Owner', 'Property Manager', 'Agent', 'Tenant', 'Attorney', 'Other'];

function makeDefaultOrderData(
  packet: Props['packet'],
  complaint: Props['complaint'],
  location: Props['location'],
  inspections: Props['inspections']
): HearingOrderData {
  const codeSections = [...new Set(
    inspections.flatMap(i => i.violations.map(v => v.violationCode).filter(Boolean))
  )];
  const rpName = complaint?.hearingRpName || location?.ownerName || '';
  return {
    attendees: rpName ? [{ name: rpName, role: 'Owner', attended: false }] : [],
    determinations: codeSections.map(cs => ({ codeSection: cs ?? '', determination: 'upheld', notes: '' })),
    permitNumber: '',
    permitDecision: '',
    reinspectionFee: '',
    nuisanceAbatementConditions: '',
    costRecovery: '',
    appealNotes: '',
    orderDate: packet.hearingDate ?? new Date().toISOString().split('T')[0],
    hearingOfficer: '',
  };
}

export default function HearingOrderEditor({ packet, complaint, location, inspections }: Props) {
  const existing = packet.hearingOrderData ? JSON.parse(packet.hearingOrderData) as HearingOrderData : null;
  const [orderData, setOrderData] = useState<HearingOrderData>(
    existing ?? makeDefaultOrderData(packet, complaint, location, inspections)
  );
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const update = (field: keyof HearingOrderData, val: HearingOrderData[keyof HearingOrderData]) => {
    setOrderData(prev => ({ ...prev, [field]: val }));
  };

  const updateAttendee = (i: number, field: keyof HearingOrderData['attendees'][0], val: string | boolean) => {
    setOrderData(prev => ({
      ...prev,
      attendees: prev.attendees.map((a, idx) => idx === i ? { ...a, [field]: val } : a),
    }));
  };

  const addAttendee = () => setOrderData(prev => ({
    ...prev,
    attendees: [...prev.attendees, { name: '', role: 'Owner', attended: false }],
  }));

  const removeAttendee = (i: number) => setOrderData(prev => ({
    ...prev,
    attendees: prev.attendees.filter((_, idx) => idx !== i),
  }));

  const addDetermination = () => setOrderData(prev => ({
    ...prev,
    determinations: [...prev.determinations, { codeSection: '', determination: 'upheld', notes: '' }],
  }));

  const updateDetermination = (i: number, field: string, val: string) => {
    setOrderData(prev => ({
      ...prev,
      determinations: prev.determinations.map((d, idx) =>
        idx === i ? { ...d, [field]: val } : d
      ),
    }));
  };

  const removeDetermination = (i: number) => setOrderData(prev => ({
    ...prev,
    determinations: prev.determinations.filter((_, idx) => idx !== i),
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveHearingOrder({
        packetId: packet.id,
        hearingOrderData: JSON.stringify(orderData),
        hearingOrderDate: orderData.orderDate || undefined,
        complaintId: complaint?.id,
      });
      toast.success('Hearing Order saved');
    } catch {
      toast.error('Failed to save Hearing Order');
    } finally {
      setSaving(false);
    }
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 overflow-auto">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #hearing-order-print, #hearing-order-print * { visibility: visible; }
            #hearing-order-print { position: fixed; top: 0; left: 0; width: 100%; }
            .print-toolbar { display: none !important; }
            .print-page-break { page-break-after: always; break-after: page; }
            .packet-page { padding: 0.75in; min-height: 10.5in; box-sizing: border-box; }
          }
          @media screen {
            .packet-page { width: 8.5in; min-height: 11in; padding: 0.75in; background: white; margin: 0 auto 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); box-sizing: border-box; }
          }
        `}</style>
        <div className="print-toolbar sticky top-0 z-10 bg-card border-b border-border shadow-md px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowPreview(false)} className="text-sm text-muted-foreground hover:text-foreground">← Back to Editor</button>
            <h2 className="text-sm font-bold text-foreground">Director's Hearing Order — Preview</h2>
          </div>
          <Button size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print / Save PDF
          </Button>
        </div>
        <div className="py-8 px-4" id="hearing-order-print">
          <PacketHearingOrder
            packet={packet}
            complaint={complaint}
            location={location}
            inspections={inspections}
            orderData={orderData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-1">
      {/* Order date + Officer */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">Order Date</Label>
          <Input type="date" value={orderData.orderDate} onChange={e => update('orderDate', e.target.value)} className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">Hearing Officer</Label>
          <Input value={orderData.hearingOfficer} onChange={e => update('hearingOfficer', e.target.value)} placeholder="Name" className="h-8 text-sm" />
        </div>
      </div>

      {/* Attendance */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Attendance</Label>
          <span className="text-xs text-muted-foreground">{orderData.attendees.length} part{orderData.attendees.length !== 1 ? 'ies' : 'y'}</span>
        </div>
        <div className="space-y-2">
          {orderData.attendees.map((a, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg border border-border">
              <Input value={a.name} onChange={e => updateAttendee(i, 'name', e.target.value)}
                placeholder="Full name" className="h-7 text-sm flex-1" />
              <Select value={a.role} onValueChange={v => updateAttendee(i, 'role', v)}>
                <SelectTrigger className="h-7 text-xs w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>{PARTY_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                <Checkbox checked={a.attended} onCheckedChange={v => updateAttendee(i, 'attended', !!v)} />
                <span className="text-xs">Attended</span>
              </label>
              <button onClick={() => removeAttendee(i)} className="text-muted-foreground hover:text-destructive p-0.5">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addAttendee}>
            <Plus className="w-3.5 h-3.5" /> Add Party
          </Button>
        </div>
      </div>

      {/* Determinations */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Code Section Determinations</Label>
        </div>
        <div className="space-y-2">
          {orderData.determinations.map((d, i) => (
            <div key={i} className="p-2.5 bg-muted/30 rounded-lg border border-border space-y-2">
              <div className="flex items-center gap-2">
                <Input value={d.codeSection} onChange={e => updateDetermination(i, 'codeSection', e.target.value)}
                  placeholder="Code section" className="h-7 text-sm font-mono flex-1" />
                <Select value={d.determination} onValueChange={v => updateDetermination(i, 'determination', v)}>
                  <SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DETERMINATION_OPTIONS.map(o => (
                      <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button onClick={() => removeDetermination(i)} className="text-muted-foreground hover:text-destructive p-0.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <Input value={d.notes} onChange={e => updateDetermination(i, 'notes', e.target.value)}
                placeholder="Notes / conditions for this section..." className="h-7 text-sm" />
            </div>
          ))}
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addDetermination}>
            <Plus className="w-3.5 h-3.5" /> Add Code Section
          </Button>
        </div>
      </div>

      {/* Permit */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">Permit Number (if applicable)</Label>
          <Input value={orderData.permitNumber} onChange={e => update('permitNumber', e.target.value)} placeholder="Permit #" className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">Permit Decision</Label>
          <Input value={orderData.permitDecision} onChange={e => update('permitDecision', e.target.value)} placeholder="e.g. Suspended" className="h-8 text-sm" />
        </div>
      </div>

      {/* Fee */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-1 block">Reinspection Fee</Label>
        <Input value={orderData.reinspectionFee} onChange={e => update('reinspectionFee', e.target.value)} placeholder="e.g. $250.00" className="h-8 text-sm w-48" />
      </div>

      {/* Conditions */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-1 block">Nuisance Abatement Conditions</Label>
        <Textarea value={orderData.nuisanceAbatementConditions}
          onChange={e => update('nuisanceAbatementConditions', e.target.value)}
          placeholder="Enter abatement conditions and required corrective actions..."
          className="text-sm resize-none" rows={3} />
      </div>

      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-1 block">Cost Recovery Notes</Label>
        <Textarea value={orderData.costRecovery}
          onChange={e => update('costRecovery', e.target.value)}
          placeholder="Enter cost recovery details if applicable..."
          className="text-sm resize-none" rows={2} />
      </div>

      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-1 block">Appeal Process Notes (leave blank for standard boilerplate)</Label>
        <Textarea value={orderData.appealNotes}
          onChange={e => update('appealNotes', e.target.value)}
          placeholder="Leave blank for standard 30-day appeal boilerplate..."
          className="text-sm resize-none" rows={2} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <Button onClick={handleSave} disabled={saving} className="gap-2 flex-1">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Save Order
        </Button>
        <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-2">
          <Printer className="w-4 h-4" /> Preview & Print
        </Button>
      </div>
    </div>
  );
}
