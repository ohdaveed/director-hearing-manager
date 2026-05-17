import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { getLocationHistory, GetLocationHistoryOutputType } from 'zite-endpoints-sdk';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Building2, ChevronLeft, User, Phone, Mail, Home, MapPin,
  ClipboardList, FileText, CheckCircle2, XCircle, Clock, AlertCircle,
  DollarSign, Hash, Upload,
} from 'lucide-react';
import { COMPLAINT_STATUS_THEME } from '@/utils/badgeThemes';
import ImportedReportsTab from '@/components/ImportedReportsTab';
import { sanitizeText } from '@/utils/sanitizeText';

type LocationData = GetLocationHistoryOutputType['location'];
type Inspection = GetLocationHistoryOutputType['inspections'][0];
type Complaint = GetLocationHistoryOutputType['complaints'][0];

function fmt(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString();
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number | boolean }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{String(value)}</p>
      </div>
    </div>
  );
}

function OwnerTab({ loc }: { loc: LocationData }) {
  return (
    <div className="space-y-5">
      {/* Property Info */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Property Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoItem icon={<Hash className="w-3.5 h-3.5" />} label="Location ID" value={loc.locationId} />
          <InfoItem icon={<Building2 className="w-3.5 h-3.5" />} label="Facility Type" value={loc.facilityType} />
          <InfoItem icon={<Hash className="w-3.5 h-3.5" />} label="Block / Lot" value={loc.blockLot} />
          <InfoItem icon={<Building2 className="w-3.5 h-3.5" />} label="DBA" value={loc.dba} />
          <InfoItem icon={<Building2 className="w-3.5 h-3.5" />} label="Units" value={loc.numberOfUnits} />
          <InfoItem icon={<Building2 className="w-3.5 h-3.5" />} label="Rooms" value={loc.numberOfRooms} />
          <InfoItem icon={<MapPin className="w-3.5 h-3.5" />} label="Census Tract" value={loc.censusTract} />
          <InfoItem icon={<DollarSign className="w-3.5 h-3.5" />} label="Current Fees"
            value={loc.currentFees !== undefined ? `$${loc.currentFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : undefined} />
        </div>
        {loc.buildingFeatures && loc.buildingFeatures.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Building Features</p>
            <div className="flex flex-wrap gap-1.5">
              {loc.buildingFeatures.map(f => (
                <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
              ))}
            </div>
          </div>
        )}
        {loc.healthyHousing && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary">
            <CheckCircle2 className="w-3.5 h-3.5" /> Healthy Housing Program
          </div>
        )}
      </div>

      {/* Owner Info */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Owner / Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoItem icon={<User className="w-3.5 h-3.5" />} label="Owner Name" value={loc.ownerName} />
          <InfoItem icon={<Home className="w-3.5 h-3.5" />} label="Mailing Address" value={loc.ownerAddress} />
          <InfoItem icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={loc.ownerPhone} />
          <InfoItem icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={loc.ownerEmail} />
        </div>
        {!loc.ownerName && !loc.ownerAddress && !loc.ownerPhone && !loc.ownerEmail && (
          <p className="text-xs text-muted-foreground italic">No owner info on file.</p>
        )}
      </div>

      {/* Management */}
      {(loc.managementName || loc.responsibleParty) && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Management / Responsible Party</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem icon={<Building2 className="w-3.5 h-3.5" />} label="Management Company" value={loc.managementName} />
            <InfoItem icon={<User className="w-3.5 h-3.5" />} label="Responsible Party" value={loc.responsibleParty} />
            <InfoItem icon={<Phone className="w-3.5 h-3.5" />} label="RP Phone" value={loc.responsiblePartyPhone} />
            <InfoItem icon={<Mail className="w-3.5 h-3.5" />} label="RP Email" value={loc.responsiblePartyEmail} />
          </div>
        </div>
      )}
    </div>
  );
}

function InspectionsTab({ inspections }: { inspections: Inspection[] }) {
  if (inspections.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
        <ClipboardList className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="text-sm font-medium text-muted-foreground">No inspections on record</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="divide-y divide-border">
        {inspections.map(ins => (
          <div key={ins.id} className="px-5 py-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-semibold text-foreground">{fmt(ins.inspectionDate)}</span>
                {ins.complaintId && (
                  <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    #{ins.complaintId}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                {ins.inspectionType && <span>{ins.inspectionType}</span>}
                {ins.inspector && <span>· {ins.inspector}</span>}
              </div>
              {ins.notes && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sanitizeText(ins.notes)}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
              {(ins.violationCount ?? 0) > 0 && (
                <span className="text-xs font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                  {ins.violationCount} viol.
                </span>
              )}
              {ins.inspectionRating === 'Satisfactory' && (
                <span className="flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Sat.
                </span>
              )}
              {ins.inspectionRating === 'Unsatisfactory' && (
                <span className="flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                  <XCircle className="w-3 h-3" /> Unsat.
                </span>
              )}
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                ins.status === 'Submitted' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
              }`}>
                {ins.status === 'Submitted' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {ins.status ?? 'Draft'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComplaintsTab({ complaints }: { complaints: Complaint[] }) {
  if (complaints.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
        <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="text-sm font-medium text-muted-foreground">No complaints on record</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="divide-y divide-border">
        {complaints.map(c => {
          const badgeCls = COMPLAINT_STATUS_THEME[c.status as keyof typeof COMPLAINT_STATUS_THEME] ?? 'bg-muted text-muted-foreground';
          return (
            <div key={c.id} className="px-5 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {c.complaintId && (
                    <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      #{c.complaintId}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-foreground">{fmt(c.dateEntered)}</span>
                  {c.dateClosed && (
                    <span className="text-xs text-muted-foreground">Closed {fmt(c.dateClosed)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  {c.complaintType && <span>{c.complaintType}</span>}
                  {c.assignedTo && <span>· {c.assignedTo.replace(' (DPH)', '')}</span>}
                </div>
                {c.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sanitizeText(c.description)}</p>
                )}
                {c.category && c.category.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {c.category.map(cat => (
                      <span key={cat} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{cat}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                {c.status && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeCls}`}>
                    {c.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LocationPage() {
  const { locationRecordId } = useParams<{ locationRecordId?: string }>();
  const navigate = useNavigate();

  if (!locationRecordId) return <Navigate to="/all-locations" replace />;

  return <LocationPageContent locationRecordId={locationRecordId} onBack={() => navigate(-1)} />;
}

function LocationPageContent({ locationRecordId, onBack }: { locationRecordId: string; onBack: () => void }) {
  const [data, setData] = useState<GetLocationHistoryOutputType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    getLocationHistory({ locationRecordId })
      .then(setData)
      .catch(() => toast.error('Failed to load location'))
      .finally(() => setLoading(false));
  }, [locationRecordId]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : data ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold text-foreground">{data.location.address ?? 'Unknown Address'}</h1>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                {data.location.locationId && (
                  <span className="font-mono">ID: {data.location.locationId}</span>
                )}
                {data.location.facilityType && (
                  <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{data.location.facilityType}</span>
                )}
                <span className="flex items-center gap-1">
                  <ClipboardList className="w-3.5 h-3.5" />
                  {data.inspections.length} inspection{data.inspections.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {data.complaints.length} complaint{data.complaints.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Location not found</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : data ? (
          <Tabs defaultValue="owner">
            <TabsList className="w-full mb-5">
              <TabsTrigger value="owner" className="flex-1 gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Owner Info
              </TabsTrigger>
              <TabsTrigger value="inspections" className="flex-1 gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                Inspections
                {data.inspections.length > 0 && (
                  <span className="ml-1 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full font-mono">
                    {data.inspections.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="complaints" className="flex-1 gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Complaints
                {data.complaints.length > 0 && (
                  <span className="ml-1 bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full font-mono">
                    {data.complaints.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="imported" className="flex-1 gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Import Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="owner">
              <OwnerTab loc={data.location} />
            </TabsContent>
            <TabsContent value="inspections">
              <InspectionsTab inspections={data.inspections} />
            </TabsContent>
            <TabsContent value="complaints">
              <ComplaintsTab complaints={data.complaints} />
            </TabsContent>
            <TabsContent value="imported">
              <ImportedReportsTab locationId={data.location.id} />
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </div>
  );
}
