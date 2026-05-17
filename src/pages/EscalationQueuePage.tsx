import { useState, useEffect } from 'react';
import { getAllComplaints, updateEscalation, createHearingPacket, GetAllComplaintsOutputType } from 'zite-endpoints-sdk';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle, ChevronLeft, Calendar, Save, ClipboardList, Package, ExternalLink, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ComplaintListItem from '@/components/ComplaintListItem';
import ComplaintDetailView from '@/components/ComplaintDetailView';
import { toast } from 'sonner';
import { HEARING_STATUS_OPTIONS } from '@/utils/complaintStatuses';


type Complaint = GetAllComplaintsOutputType['complaints'][0];

const HEARING_STATUSES = HEARING_STATUS_OPTIONS;
const ENTRY_TYPES = ['Hearing Referral', 'NOV', 'Contact Attempt', 'Other'];

const HEARING_STATUS_COLORS: Record<string, string> = {
  'Referral Pending': 'bg-warning/10 text-warning border-warning/20',
  'Referred': 'bg-warning/20 text-warning border-warning/30',
  'Hearing Scheduled': 'bg-accent/50 text-accent-foreground border-accent/30',
  'Heard': 'bg-primary/10 text-primary border-primary/20',
  'Decision Issued': 'bg-success/10 text-success border-success/20',
};

const PACKET_ELIGIBLE_STATUSES = ['Referral Pending', 'Referred', 'Hearing Scheduled', 'Heard', 'Decision Issued'];

function EscalationEditor({ complaint, onUpdated, onComplaintPacketCreated }: {
  complaint: Complaint;
  onUpdated: (c: Partial<Complaint>) => void;
  onComplaintPacketCreated: (complaintId: string, packetId: string) => void;
}) {
  const [hearingStatus, setHearingStatus] = useState(complaint.hearingStatus ?? 'None');
  const [hearingDate, setHearingDate] = useState(complaint.hearingDate ?? '');
  const [chronologySummary, setChronologySummary] = useState('');
  const [entryType, setEntryType] = useState('Hearing Referral');
  const [saving, setSaving] = useState(false);
  const [creatingPacket, setCreatingPacket] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    setHearingStatus(complaint.hearingStatus ?? 'None');
    setHearingDate(complaint.hearingDate ?? '');
    setChronologySummary('');
  }, [complaint.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEscalation({
        complaintRecordId: complaint.id,
        hearingStatus,
        hearingDate: hearingDate || undefined,
        chronologySummary: chronologySummary || undefined,
        chronologyEntryType: entryType,
      });
      onUpdated({ hearingStatus, hearingDate });
      setChronologySummary('');
      toast.success('Escalation record updated');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePacket = async () => {
    setCreatingPacket(true);
    setShowCreateDialog(false);
    try {
      const result = await createHearingPacket({ complaintRecordId: complaint.id });
      if (result.created) {
        toast.success('Hearing packet created! Navigate to Hearing Packets to manage it.');
        onComplaintPacketCreated(complaint.id, result.packetId);
      } else {
        toast.info('A hearing packet already exists for this complaint.');
        onComplaintPacketCreated(complaint.id, result.packetId);
      }
    } catch {
      toast.error('Failed to create hearing packet');
    } finally {
      setCreatingPacket(false);
    }
  };

  const hsCls = HEARING_STATUS_COLORS[hearingStatus] ?? 'bg-muted text-muted-foreground border-border';
  const isPacketEligible = PACKET_ELIGIBLE_STATUSES.includes(hearingStatus);
  const hasPacket = !!complaint.hearingPacketId;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5" /> Escalation Controls
      </h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Hearing Status</label>
          <Select value={hearingStatus} onValueChange={setHearingStatus}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {HEARING_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {hearingStatus !== 'None' && (
            <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full border font-medium ${hsCls}`}>
              ⚖ {hearingStatus}
            </span>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Hearing Date
          </label>
          <Input type="date" value={hearingDate} onChange={e => setHearingDate(e.target.value)} className="h-9 text-sm" />
        </div>
      </div>

      {/* Hearing Packet creation */}
      {isPacketEligible && (
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Director's Hearing Packet</p>
                <p className="text-xs text-muted-foreground">
                  {hasPacket ? 'A packet exists for this case.' : 'No packet created yet.'}
                </p>
              </div>
            </div>
            {hasPacket ? (
              <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Packet Created
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => setShowCreateDialog(true)}
                disabled={creatingPacket}
              >
                {creatingPacket ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
                Create Packet
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add Chronology Entry</p>
        <div className="flex gap-2">
          <Select value={entryType} onValueChange={setEntryType}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENTRY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          placeholder="Describe the escalation action or decision..."
          value={chronologySummary}
          onChange={e => setChronologySummary(e.target.value)}
          className="text-sm resize-none"
          rows={3}
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Escalation Record
      </Button>

      {/* Create Packet Confirmation Dialog */}
      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Create Hearing Packet
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>This will create a new Director's Hearing Packet for this case.</p>
                <div className="bg-muted rounded-lg p-3 space-y-1 text-foreground">
                  {complaint.complaintId && (
                    <p><span className="font-medium">Complaint:</span> <span className="font-mono">#{complaint.complaintId}</span></p>
                  )}
                  {complaint.address && (
                    <p><span className="font-medium">Address:</span> {complaint.address}</p>
                  )}
                  {hearingDate && (
                    <p><span className="font-medium">Hearing Date:</span> {new Date(hearingDate + 'T00:00:00').toLocaleDateString()}</p>
                  )}
                  {complaint.assignedTo && (
                    <p><span className="font-medium">Inspector:</span> {complaint.assignedTo}</p>
                  )}
                </div>
                <p className="text-muted-foreground">Navigate to the <strong>Hearing Packets</strong> section to manage and print the packet.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreatePacket}>Create Packet</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EscalationQueuePage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllComplaints({}).then(r => {
      const escalated = r.complaints.filter(c =>
        c.status === 'Escalated' || c.status === 'Non-Compliant' || (c.hearingStatus && c.hearingStatus !== 'None')
      ).sort((a, b) => (b.dateEntered ?? '').localeCompare(a.dateEntered ?? ''));
      setComplaints(escalated);
    }).catch(() => toast.error('Failed to load queue')).finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? complaints.filter(c => c.address?.toLowerCase().includes(search.toLowerCase()) || c.complaintId?.includes(search))
    : complaints;

  const handleUpdated = (patch: Partial<Complaint>) => {
    if (!selected) return;
    const updated = { ...selected, ...patch };
    setSelected(updated);
    setComplaints(prev => prev.map(c => c.id === selected.id ? updated : c));
  };

  const handlePacketCreated = (complaintId: string, packetId: string) => {
    setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, hearingPacketId: packetId } : c));
    if (selected?.id === complaintId) {
      setSelected(prev => prev ? { ...prev, hearingPacketId: packetId } : prev);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-[57px] z-10">
        <div className="container mx-auto px-4 sm:px-6 py-2.5 max-w-[1300px]">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input placeholder="Search by address or ID..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-sm pl-8" />
            </div>
            <span className="text-sm text-muted-foreground tabular-nums ml-auto">{filtered.length} case{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-5 max-w-[1300px]">
        <div className="flex gap-5">
          <div className={`flex-shrink-0 w-full md:w-80 lg:w-96 ${showDetail ? 'hidden md:block' : 'block'}`}>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl px-4 py-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-5 w-20 rounded-full shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No escalated cases</p>
                <p className="text-xs mt-1">Cases marked Escalated or Non-Compliant appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(c => (
                  <ComplaintListItem key={c.id} complaint={c} isSelected={selected?.id === c.id} onClick={() => { setSelected(c); setShowDetail(true); }} />
                ))}
              </div>
            )}
          </div>

          <div className={`flex-1 min-w-0 space-y-4 ${showDetail ? 'block' : 'hidden md:block'}`}>
            {selected ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setShowDetail(false)} className="md:hidden mb-1 gap-1.5 -ml-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <EscalationEditor complaint={selected} onUpdated={handleUpdated} onComplaintPacketCreated={handlePacketCreated} />
                <ComplaintDetailView key={selected.id} complaint={selected} onStatusUpdate={() => {}} viewMode="readonly" />
              </>
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
                <ClipboardList className="w-14 h-14 mb-4 opacity-20" />
                <p className="font-semibold text-foreground">Select a case</p>
                <p className="text-sm mt-1">Review complaint history and update hearing status or add a chronology note.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
