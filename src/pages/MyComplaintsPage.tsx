/**
 * MyComplaintsPage.tsx
 *
 * The inspector's personal complaint list. Shows only complaints assigned to the
 * currently logged-in inspector, with filters, a list view, and an inline detail panel.
 *
 * Sorting: drafts first (so in-progress inspections surface at the top), then
 * by reinspection due date ascending (most urgent next).
 *
 * If initialComplaintId is provided (e.g. from the dashboard alert cards), that
 * complaint is automatically selected and its detail panel is shown.
 *
 * Uses ComplaintFilterBar (shared with AllComplaintsPage) for the filter row.
 * Inspector-specific filter is omitted since the view is already scoped to one person.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAssignedComplaints, getComplaintDetail, updateComplaintStatus,
  GetAssignedComplaintsOutputType,
} from 'zite-endpoints-sdk';
import { Button } from '@/components/ui/button';
import { Loader2, ClipboardList, ChevronLeft, FilePlus } from 'lucide-react';
import ComplaintListItem from '@/components/ComplaintListItem';
import ComplaintDetailView from '@/components/ComplaintDetailView';
import ComplaintFilterBar from '@/components/ComplaintFilterBar';
import { toast } from 'sonner';


type Complaint = GetAssignedComplaintsOutputType['complaints'][0];

type Props = {
  inspectorName: string;
};

export default function MyComplaintsPage({ inspectorName }: Props) {
  const { id: urlComplaintId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  // ── State ───────────────────────────────────────────────────────────────────

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Complaint | null>(null);

  /** Filter state — all client-side */
  const [statusFilter, setStatusFilter] = useState('');
  const [hearingStatusFilter, setHearingStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showDetail, setShowDetail] = useState(false);

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchComplaints = useCallback(async () => {
    if (!inspectorName) return;
    setLoading(true);
    try {
      const r = await getAssignedComplaints({ inspector: inspectorName });
      // Sort: draft inspections first (so "Resume Draft" is always visible), then by reinspection date
      const sorted = [...r.complaints].sort((a, b) => {
        if (a.draftInspectionId && !b.draftInspectionId) return -1;
        if (!a.draftInspectionId && b.draftInspectionId) return 1;
        return (a.reinspectionDueOnAfter ?? '').localeCompare(b.reinspectionDueOnAfter ?? '');
      });
      setComplaints(sorted);
      // Auto-select a complaint if navigated here via URL deep link
      if (urlComplaintId) {
        const target = sorted.find(c => c.id === urlComplaintId);
        if (target) { setSelected(target); setShowDetail(true); }
      }
    } catch { } finally {
      setLoading(false);
    }
  }, [inspectorName]);

  useEffect(() => {
    fetchComplaints();
    setSelected(null);
    setShowDetail(false);
  }, [fetchComplaints]);

  // Re-fetch when tab becomes visible again (e.g. returning from inspection form)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchComplaints();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchComplaints]);

  // ── Client-side filtering ───────────────────────────────────────────────────

  const filtered = complaints.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (hearingStatusFilter && (c.hearingStatus ?? 'None') !== hearingStatusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.address?.toLowerCase().includes(q) && !c.complaintId?.includes(q)) return false;
    }
    return true;
  });

  // ── Event handlers ──────────────────────────────────────────────────────────

  const handleSelect = (c: Complaint) => {
    setSelected(c);
    setShowDetail(true);
    navigate(`/my-complaints/${c.id}`, { replace: true });
  };

  /** Optimistically update status then confirm with a fresh detail fetch */
  const handleStatusUpdate = async (updatedStatus: string) => {
    if (!selected) return;
    setComplaints(prev => prev.map(c => c.id === selected.id ? { ...c, status: updatedStatus } : c));
    setSelected(prev => prev ? { ...prev, status: updatedStatus } : prev);
    try {
      const detail = await getComplaintDetail({ complaintRecordId: selected.id });
      const freshStatus = detail.complaint.status ?? updatedStatus;
      setComplaints(prev => prev.map(c =>
        c.id === selected.id
          ? { ...c, status: freshStatus, reinspectionDueOnAfter: detail.complaint.reinspectionDueOnAfter, draftInspectionId: detail.draftInspectionId }
          : c
      ));
      setSelected(prev => prev ? { ...prev, status: freshStatus } : prev);
    } catch { }
  };

  /** One-tap status change from the list card — supports undo via toast */
  const handleQuickAction = async (complaint: Complaint, newStatus: string) => {
    const prevStatus = complaint.status;
    // Optimistic update so the UI feels instant
    setComplaints(prev => prev.map(c => c.id === complaint.id ? { ...c, status: newStatus } : c));
    if (selected?.id === complaint.id) setSelected(prev => prev ? { ...prev, status: newStatus } : prev);
    try {
      await updateComplaintStatus({
        complaintRecordId: complaint.id,
        status: newStatus,
        previousStatus: prevStatus ?? '',
      });
      toast.success(`Status → ${newStatus}`, {
        action: { label: 'Undo', onClick: async () => {
          setComplaints(prev => prev.map(c => c.id === complaint.id ? { ...c, status: prevStatus } : c));
          if (selected?.id === complaint.id) setSelected(prev => prev ? { ...prev, status: prevStatus } : prev);
          await updateComplaintStatus({ complaintRecordId: complaint.id, status: prevStatus ?? '', previousStatus: newStatus });
        }},
      });
    } catch {
      // Revert optimistic update on failure
      setComplaints(prev => prev.map(c => c.id === complaint.id ? { ...c, status: prevStatus } : c));
      if (selected?.id === complaint.id) setSelected(prev => prev ? { ...prev, status: prevStatus } : prev);
      toast.error('Failed to update status');
    }
  };

  /** Navigate to inspection form with this complaint pre-selected */
  const handleStartInspection = (complaint: Complaint) => {
    navigate(`/inspection/${complaint.id}`);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Shared filter bar — no inspector dropdown (view is already scoped to this inspector) */}
      <ComplaintFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        hearingStatusFilter={hearingStatusFilter}
        onHearingStatusChange={setHearingStatusFilter}
        search={search}
        onSearchChange={setSearch}
        resultCount={filtered.length}
        loading={loading}
        actions={
          <Button size="sm" className="gap-1.5 shrink-0 sm:ml-auto" onClick={() => navigate('/new-complaint')}>
            <FilePlus className="w-3.5 h-3.5" /> Add Complaint
          </Button>
        }
      />

      <div className="container mx-auto px-4 sm:px-6 py-5 max-w-[1300px]">
        <div className="flex items-start gap-0">

          {/* ── Complaint list — sticky sidebar with independent scroll ── */}
          <div className={`
            flex-shrink-0 w-full md:w-[360px] lg:w-[420px]
            md:sticky md:top-[120px] md:max-h-[calc(100vh-130px)]
            md:flex md:flex-col
            md:border-r md:border-border md:pr-5 md:mr-6
            ${showDetail ? 'hidden md:flex' : 'flex flex-col'}
          `}>
            {/* List count header */}
            {!loading && filtered.length > 0 && (
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 pl-0.5">
                {filtered.length} complaint{filtered.length !== 1 ? 's' : ''}
              </p>
            )}

            {/* Scrollable list */}
            <div className="flex-1 md:overflow-y-auto space-y-2 pb-6 md:pr-1">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading complaints...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No complaints found</p>
                  <p className="text-xs mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                filtered.map(c => (
                  <ComplaintListItem
                    key={c.id}
                    complaint={c}
                    isSelected={selected?.id === c.id}
                    onClick={() => handleSelect(c)}
                    onQuickAction={(newStatus) => handleQuickAction(c, newStatus)}
                    onLinkLocation={() => handleSelect(c)}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Detail panel ── */}
          <div className={`flex-1 min-w-0 ${showDetail ? 'block' : 'hidden md:block'}`}>
            {selected ? (
              <div>
                {/* Mobile back button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowDetail(false); navigate('/my-complaints', { replace: true }); }}
                  className="md:hidden mb-3 gap-1.5 -ml-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to list
                </Button>
                <ComplaintDetailView
                  key={selected.id}
                  complaint={selected}
                  onStatusUpdate={handleStatusUpdate}
                  viewMode="inspector"

                />
              </div>
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 border border-border">
                  <ClipboardList className="w-7 h-7 opacity-30" />
                </div>
                <p className="font-semibold text-foreground">Select a complaint</p>
                <p className="text-sm mt-1.5 max-w-xs">
                  Click any complaint from the list to view its details, inspection history, and actions.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
