/**
 * ComplaintsPage.tsx
 *
 * Unified complaint list for all roles — replaces the old "My Complaints"
 * and "All Complaints" nav tabs and moves Add/Import actions into the view.
 *
 *   Inspector / Super Admin  → "Mine" (assigned) by default; toggle to "All" (read-only)
 *   Admin / Program Manager  → "All" complaints directly, no toggle
 *
 * Routes: /complaints  /complaints/:id  /complaints/new  /complaints/import
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintService } from '@/services/complaintService';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, ClipboardList, ChevronLeft, FilePlus, Upload } from 'lucide-react';
import ComplaintListItem from '@/components/ComplaintListItem';
import ComplaintDetailView from '@/components/ComplaintDetailView';
import ComplaintSummaryCards from '@/components/ComplaintSummaryCards';
import ComplaintFilterBar from '@/components/ComplaintFilterBar';
import { toast } from 'sonner';

type Complaint = any; // Properly type later

const ADMIN_ROLES = ['Admin', 'Program Manager', 'Super Admin'];
const CAN_CREATE_ROLES = ['Inspector', 'Admin', 'Super Admin'];
const MINE_TOGGLE_ROLES = ['Inspector', 'Super Admin'];

export default function ComplaintsPage() {
  const { user } = useAuth();
  const { id: urlComplaintId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const activeRole = user?.role ?? '';
  const showMineToggle = MINE_TOGGLE_ROLES.includes(activeRole);
  const canCreate = CAN_CREATE_ROLES.includes(activeRole);
  const isAdmin = ADMIN_ROLES.includes(activeRole);
  const inspectorName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '';

  const [scope, setScope] = useState<'mine' | 'all'>(showMineToggle ? 'mine' : 'all');
  const [statusFilter, setStatusFilter] = useState('');
  const [hearingStatusFilter, setHearingStatusFilter] = useState('');
  const [inspectorFilter, setInspectorFilter] = useState('');
  const [search, setSearch] = useState('');

  // ── Data fetching ───────────────────────────────────────────────────────────

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['complaints', scope, inspectorName],
    queryFn: () => complaintService.getAll(scope === 'mine' ? { assignedTo: inspectorName } : {}),
    enabled: !!user,
  });

  const selected = useMemo(() => {
    if (!urlComplaintId) return null;
    return complaints.find((c: any) => c.id === urlComplaintId) || null;
  }, [urlComplaintId, complaints]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => 
      complaintService.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    }
  });

  // ── Filtering ───────────────────────────────────────────────────────────────

  const filtered = complaints.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (hearingStatusFilter && (c.hearingStatus ?? 'None') !== hearingStatusFilter) return false;
    if (scope === 'all' && inspectorFilter && c.assignedTo !== inspectorFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.address?.toLowerCase().includes(q) && !c.complaintId?.includes(q)) return false;
    }
    return true;
  });

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleScopeChange = (newScope: 'mine' | 'all') => {
    if (newScope === scope) return;
    setScope(newScope);
    setSelected(null);
    setShowDetail(false);
    setInspectorFilter('');
    navigate('/complaints', { replace: true });
  };

  const handleSelect = (c: Complaint) => {
    setSelected(c);
    setShowDetail(true);
    navigate(`/complaints/${c.id}`, { replace: true });
  };

  const handleStatusUpdate = async (updatedStatus: string) => {
    if (!selected) return;
    try {
      await updateStatusMutation.mutateAsync({ id: selected.id, status: updatedStatus });
      toast.success(`Status updated to ${updatedStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleQuickAction = async (complaint: Complaint, newStatus: string) => {
    const prevStatus = complaint.status;
    try {
      await updateStatusMutation.mutateAsync({ id: complaint.id, status: newStatus });
      toast.success(`Status → ${newStatus}`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            await updateStatusMutation.mutateAsync({ id: complaint.id, status: prevStatus ?? '' });
          },
        },
      });
    } catch {
      toast.error('Failed to update status');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const actionButtons = (
    <div className="flex items-center gap-2 shrink-0">
      {canCreate && (
        <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => navigate('/complaints/new')}>
          <FilePlus className="w-3.5 h-3.5" /> New Complaint
        </Button>
      )}
      <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => navigate('/complaints/import')}>
        <Upload className="w-3.5 h-3.5" /> Import CSV
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* Mine / All scope toggle — Inspector and Super Admin only */}
      {showMineToggle && (
        <div className="border-b border-border/60 bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 max-w-[1300px] py-2 flex items-center gap-3">
            <div className="flex items-center bg-muted/60 border border-border rounded-lg p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => handleScopeChange('mine')}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all ${
                  scope === 'mine' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                My Complaints
              </button>
              <button
                type="button"
                onClick={() => handleScopeChange('all')}
                className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all ${
                  scope === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Complaints
              </button>
            </div>
            {scope === 'all' && (
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Read-only view · all inspectors
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filter bar with contextual action buttons */}
      <ComplaintFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        hearingStatusFilter={hearingStatusFilter}
        onHearingStatusChange={setHearingStatusFilter}
        search={search}
        onSearchChange={setSearch}
        resultCount={filtered.length}
        loading={isLoading}
        {...(scope === 'all' ? { inspectorFilter, onInspectorChange: setInspectorFilter } : {})}
        actions={actionButtons}
      />

      <div className="container mx-auto px-4 sm:px-6 py-5 max-w-[1300px]">
        {!isLoading && complaints.length > 0 && scope === 'all' && (
          <ComplaintSummaryCards complaints={complaints} />
        )}

        <div className="flex items-start gap-0">

          {/* Complaint list — sticky sidebar with independent scroll */}
          <div className={`
            flex-shrink-0 w-full md:w-[360px] lg:w-[420px]
            md:sticky md:top-[120px] md:max-h-[calc(100vh-130px)]
            md:flex md:flex-col
            md:border-r md:border-border md:pr-5 md:mr-6
            ${showDetail ? 'hidden md:flex' : 'flex flex-col'}
          `}>
            {!isLoading && filtered.length > 0 && (
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 pl-0.5">
                {filtered.length} complaint{filtered.length !== 1 ? 's' : ''}
              </p>
            )}
            <div className="flex-1 md:overflow-y-auto space-y-2 pb-6 md:pr-1">
              {isLoading ? (
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
                    onQuickAction={scope === 'mine' ? (newStatus) => handleQuickAction(c, newStatus) : undefined}
                    onLinkLocation={() => handleSelect(c)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className={`flex-1 min-w-0 ${showDetail ? 'block' : 'hidden md:block'}`}>
            {selected ? (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowDetail(false); setSelected(null); navigate('/complaints', { replace: true }); }}
                  className="md:hidden mb-3 gap-1.5 -ml-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to list
                </Button>
                <ComplaintDetailView
                  key={selected.id}
                  complaint={selected}
                  onStatusUpdate={handleStatusUpdate}
                  viewMode={isAdmin ? 'admin' : scope === 'mine' ? 'inspector' : 'readonly'}
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
