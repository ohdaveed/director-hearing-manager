import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInspections, GetInspectionsOutputType } from 'zite-endpoints-sdk';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, CheckCircle2, XCircle, Clock, FileText, ChevronRight, X, ClipboardCheck, Loader2 } from 'lucide-react';
import InspectionDetailPanel from '@/components/InspectionDetailPanel';
import { INSPECTORS } from '@/utils/inspectors';

type Inspection = GetInspectionsOutputType['inspections'][0];

function RatingBadge({ rating }: { rating?: string }) {
  if (rating === 'Satisfactory') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full whitespace-nowrap">
      <CheckCircle2 className="w-3 h-3" /> Sat.
    </span>
  );
  if (rating === 'Unsatisfactory') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full whitespace-nowrap">
      <XCircle className="w-3 h-3" /> Unsat.
    </span>
  );
  return <span className="text-xs text-muted-foreground">—</span>;
}

function StatusBadge({ status }: { status?: string }) {
  if (status === 'Submitted') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
      <CheckCircle2 className="w-3 h-3" /> Submitted
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full whitespace-nowrap">
      <Clock className="w-3 h-3" /> Draft
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* gap-1 added to match row gap */}
      <div className="hidden md:grid grid-cols-12 gap-1 px-4 py-2.5 bg-muted/50 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        <div className="col-span-2">Date</div>
        <div className="col-span-3">Address</div>
        <div className="col-span-2">Inspector</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-1">Rating</div>
        <div className="col-span-1 text-center">Viol.</div>
        <div className="col-span-1">Status</div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5">
            <div className="md:hidden space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex gap-2 mt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <div className="hidden md:grid grid-cols-12 items-center gap-1">
              <div className="col-span-2"><Skeleton className="h-3 w-20" /></div>
              <div className="col-span-3 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="col-span-2"><Skeleton className="h-3 w-24" /></div>
              <div className="col-span-2"><Skeleton className="h-3 w-28" /></div>
              <div className="col-span-1"><Skeleton className="h-5 w-10 rounded-full" /></div>
              <div className="col-span-1"><Skeleton className="h-5 w-6 rounded-full" /></div>
              <div className="col-span-1"><Skeleton className="h-5 w-16 rounded-full" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InspectionHistoryPage() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [addressSearch, setAddressSearch] = useState('');
  const [filterInspector, setFilterInspector] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const result = await getInspections({
        inspector: filterInspector || undefined,
        rating: filterRating || undefined,
        status: filterStatus || undefined,
        addressSearch: addressSearch || undefined,
      });
      setInspections(result.inspections);
    } catch { } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInspections(); }, [filterInspector, filterRating, filterStatus]); // eslint-disable-line

  const filtered = addressSearch
    ? inspections.filter(i => i.facilityAddress?.toLowerCase().includes(addressSearch.toLowerCase()))
    : inspections;

  const hasFilters = filterInspector || filterRating || filterStatus || addressSearch;
  const activeFilterCount = [filterInspector, filterRating, filterStatus, addressSearch].filter(Boolean).length;

  const clearFilters = () => {
    setFilterInspector(''); setFilterRating(''); setFilterStatus(''); setAddressSearch('');
  };

  return (
    <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8 max-w-[1300px]">
      {/* Page Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Inspections</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Submitted and draft inspection reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchInspections} disabled={loading} className="h-8 text-xs gap-1.5">
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            Refresh
          </Button>
          <Button size="sm" className="gap-1.5 h-8" onClick={() => navigate('/inspections/new')}>
            <ClipboardCheck className="w-3.5 h-3.5" /> Start Inspection
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl mb-5 overflow-hidden shadow-sm">
        {/* Desktop filter row */}
        <div className="hidden md:flex flex-wrap gap-2.5 items-center px-4 py-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input placeholder="Filter by address..." value={addressSearch} onChange={e => setAddressSearch(e.target.value)} className="pl-8 h-8 text-sm" />
          </div>
          <Select value={filterInspector || 'all'} onValueChange={v => setFilterInspector(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-44 h-8 text-sm"><SelectValue placeholder="All inspectors" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Inspectors</SelectItem>
              {INSPECTORS.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRating || 'all'} onValueChange={v => setFilterRating(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="All ratings" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="Satisfactory">Satisfactory</SelectItem>
              <SelectItem value="Unsatisfactory">Unsatisfactory</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus || 'all'} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-36 h-8 text-sm"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-8" onClick={clearFilters}>
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Mobile: toggle button row */}
        <div className="md:hidden flex items-center gap-2 px-4 py-2.5">
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(f => !f)} className="gap-2 h-8 text-sm">
            <Search className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <span className="ml-auto text-sm text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Mobile expanded filters */}
        {showFilters && (
          <div className="md:hidden border-t border-border px-4 py-3 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input placeholder="Filter by address..." value={addressSearch} onChange={e => setAddressSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
            <Select value={filterInspector || 'all'} onValueChange={v => setFilterInspector(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All inspectors" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Inspectors</SelectItem>
                {INSPECTORS.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Select value={filterRating || 'all'} onValueChange={v => setFilterRating(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Rating" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                  <SelectItem value="Unsatisfactory">Unsatisfactory</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus || 'all'} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="gap-1 w-full h-8" onClick={clearFilters}>
                <X className="w-3.5 h-3.5" /> Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex gap-6 ${selectedId ? 'flex-col xl:flex-row' : ''}`}>
        <div className={`${selectedId ? 'xl:w-1/2' : 'w-full'} min-w-0`}>
          {loading ? (
            <LoadingSkeleton />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No inspections found</p>
              <p className="text-sm mt-1">Try adjusting your filters or submit an inspection from the form.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              {/* Desktop table header — gap-1 matches row gap so columns align */}
              <div className="hidden md:grid grid-cols-12 gap-1 px-4 py-2.5 bg-muted/50 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="col-span-2">Date</div>
                <div className="col-span-3">Address</div>
                <div className="col-span-2">Inspector</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-1">Rating</div>
                <div className="col-span-1 text-center">Viol.</div>
                <div className="col-span-1">Status</div>
              </div>

              <div className="divide-y divide-border">
                {filtered.map(insp => (
                  <button
                    key={insp.id}
                    type="button"
                    onClick={() => setSelectedId(selectedId === insp.id ? null : insp.id)}
                    className={`w-full text-left transition-colors ${
                      selectedId === insp.id
                        ? 'bg-primary/5 border-l-2 border-l-primary hover:bg-primary/8'
                        : 'hover:bg-muted/40 active:bg-muted/60'
                    }`}
                  >
                    {/* Mobile card layout */}
                    <div className="md:hidden px-4 py-3.5 min-h-[44px]">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{insp.facilityAddress || '—'}</p>
                          {insp.complaintId && <p className="text-xs text-muted-foreground font-mono">#{insp.complaintId}</p>}
                        </div>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform ${selectedId === insp.id ? 'rotate-90' : ''}`} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {insp.inspectionDate && <span>{new Date(insp.inspectionDate).toLocaleDateString()}</span>}
                        {insp.inspector && <span>· {insp.inspector}</span>}
                        {insp.inspectionType && <span>· {insp.inspectionType}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <RatingBadge rating={insp.inspectionRating} />
                        <StatusBadge status={insp.status} />
                        {(insp.violationCount ?? 0) > 0 && (
                          <span className="bg-destructive/10 text-destructive text-xs font-semibold px-2 py-0.5 rounded-full">
                            {insp.violationCount} violation{insp.violationCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desktop grid row — 7 divs summing to exactly 12 cols */}
                    <div className="hidden md:grid grid-cols-12 px-4 py-3 items-center gap-1">
                      <div className="col-span-2 text-xs text-muted-foreground tabular-nums">
                        {insp.inspectionDate ? new Date(insp.inspectionDate).toLocaleDateString() : '—'}
                      </div>
                      <div className="col-span-3 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{insp.facilityAddress || '—'}</p>
                        {insp.complaintId && <p className="text-xs text-muted-foreground font-mono">#{insp.complaintId}</p>}
                      </div>
                      <div className="col-span-2 text-xs text-foreground truncate">{insp.inspector || '—'}</div>
                      <div className="col-span-2 text-xs text-muted-foreground truncate">{insp.inspectionType || '—'}</div>
                      <div className="col-span-1">
                        <RatingBadge rating={insp.inspectionRating} />
                      </div>
                      <div className="col-span-1 text-xs text-center">
                        {(insp.violationCount ?? 0) > 0
                          ? <span className="bg-destructive/10 text-destructive font-bold px-2 py-0.5 rounded-full tabular-nums">{insp.violationCount}</span>
                          : <span className="text-muted-foreground/50">—</span>}
                      </div>
                      {/* Status — col-span-1 only (chevron removed, total stays 12) */}
                      <div className="col-span-1">
                        <StatusBadge status={insp.status} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedId && (
          <div className="xl:w-1/2 min-w-0">
            <InspectionDetailPanel
              inspectionId={selectedId}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
