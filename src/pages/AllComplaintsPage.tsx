/**
 * AllComplaintsPage.tsx
 *
 * Full complaint list view for Admin, Program Manager, and Super Admin roles.
 * Shows summary metric cards, a filter/search bar, a scrollable complaint list,
 * and an inline detail panel for the selected complaint.
 *
 * All complaints are fetched once on mount and filtered client-side for
 * instant responsiveness. The list re-fetches when the browser tab regains focus.
 *
 * Uses ComplaintFilterBar (shared with MyComplaintsPage) for the filter row.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllComplaints, getComplaintDetail, GetAllComplaintsOutputType } from 'zite-endpoints-sdk';
import { useAuth } from 'zite-auth-sdk';
import { Button } from '@/components/ui/button';
import { Loader2, ClipboardList, ChevronLeft } from 'lucide-react';
import ComplaintListItem from '@/components/ComplaintListItem';
import ComplaintDetailView from '@/components/ComplaintDetailView';
import ComplaintSummaryCards from '@/components/ComplaintSummaryCards';
import ComplaintFilterBar from '@/components/ComplaintFilterBar';

type Complaint = GetAllComplaintsOutputType['complaints'][0];

/** Roles that can edit complaint records (as opposed to view-only). */
const ADMIN_ROLES = ['Admin', 'Program Manager', 'Super Admin'];

export default function AllComplaintsPage() {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role ?? '');
  const { id: urlComplaintId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // ── State ───────────────────────────────────────────────────────────────────

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  /** Filter state — all client-side, applied to the fetched complaints array */
  const [statusFilter, setStatusFilter] = useState('');
  const [hearingStatusFilter, setHearingStatusFilter] = useState('');
  const [inspectorFilter, setInspectorFilter] = useState('');
  const [search, setSearch] = useState('');

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getAllComplaints({});
      setComplaints(r.complaints);
      if (urlComplaintId) {
        const target = r.complaints.find(c => c.id === urlComplaintId);
        if (target) { setSelected(target); setShowDetail(true); }
      }
    } catch { } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // Re-fetch when the tab becomes visible again (e.g. after returning from another tab)
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
    if (inspectorFilter && c.assignedTo !== inspectorFilter) return false;
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
    navigate(`/all-complaints/${c.id}`, { replace: true });
  };

  /** After a status update, optimistically update local state then re-fetch the detail */
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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Shared filter bar — includes inspector filter (not shown on MyComplaintsPage) */}
      <ComplaintFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        hearingStatusFilter={hearingStatusFilter}
        onHearingStatusChange={setHearingStatusFilter}
        search={search}
        onSearchChange={setSearch}
        resultCount={filtered.length}
        loading={loading}
        inspectorFilter={inspectorFilter}
        onInspectorChange={setInspectorFilter}
      />

      <div className="container mx-auto px-4 sm:px-6 py-5 max-w-[1300px]">
        {/* Summary metric cards */}
        {!loading && complaints.length > 0 && (
          <ComplaintSummaryCards complaints={complaints} />
        )}

        <div className="flex items-start gap-0">

          {/* ── Complaint list — sticky sidebar with independent scroll ── */}
          <div className={`
            flex-shrink-0 w-full md:w-[360px] lg:w-[420px]
            md:sticky md:top-[120px] md:max-h-[calc(100vh-130px)]
            md:flex md:flex-col
            md:border-r md:border-border md:pr-5 md:mr-6
            ${showDetail ? 'hidden md:flex' : 'flex flex-col'}
          `}>
            {/* List count label */}
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
                  onClick={() => { setShowDetail(false); setSelected(null); navigate('/all-complaints', { replace: true }); }}
                  className="md:hidden mb-3 gap-1.5 -ml-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to list
                </Button>
                <ComplaintDetailView
                  key={selected.id}
                  complaint={selected}
                  onStatusUpdate={handleStatusUpdate}
                  viewMode={isAdmin ? 'admin' : 'inspector'}

                />
              </div>
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 border border-border">
                  <ClipboardList className="w-7 h-7 opacity-30" />
                </div>
                <p className="font-semibold text-foreground">Select a complaint</p>
                <p className="text-sm mt-1.5 max-w-xs">
                  Click any complaint to view details, inspection history, and documents.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
