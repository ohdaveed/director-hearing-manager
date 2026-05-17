import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { UploadCloud, Loader2, FileText, Trash2, ExternalLink, AlertTriangle, Plus, X, CheckCircle2, Info } from 'lucide-react';

type ImportedReport = any['reports'][0];

type PendingUpload = { tempId: string; fileName: string; status: 'uploading' | 'parsing' | 'failed'; reportId?: string; parseOnly?: boolean; fileSizeMB?: number };
type ManualViolation = { violationLabel: string; violationCode: string; locationInProperty: string; correctiveAction: string; dueDate: string };
type ManualEntry = { reportId: string; date: string; inspector: string; type: string; rating: string; violations: ManualViolation[] };

const INSPECTION_TYPES = ['Routine', 'Routine Re-inspection', 'Complaint', 'Complaint Re-inspection', 'Field Consultation / Survey'];

function fmt(d?: string) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString();
}

function ManualEntryForm({ entry, locationId, onSaved, onRemove }: {
  entry: ManualEntry; locationId: string;
  onSaved: () => void; onRemove: () => void;
}) {
  const [data, setData] = useState(entry);
  const [saving, setSaving] = useState(false);

  const addViolation = () => setData(d => ({ ...d, violations: [...d.violations, { violationLabel: '', violationCode: '', locationInProperty: '', correctiveAction: '', dueDate: '' }] }));
  const removeViolation = (i: number) => setData(d => ({ ...d, violations: d.violations.filter((_, idx) => idx !== i) }));
  const updateViolation = (i: number, field: keyof ManualViolation, val: string) =>
    setData(d => ({ ...d, violations: d.violations.map((v, idx) => idx === i ? { ...v, [field]: val } : v) }));

  const handleSave = async () => {
    if (!data.date || !data.inspector || !data.type || !data.rating) {
      toast.error('Please fill in all required fields'); return;
    }
    setSaving(true);
    try {
      await saveImportedReportManual({
        reportId: entry.reportId, locationId,
        inspectionDate: data.date, inspectorName: data.inspector,
        inspectionType: data.type, inspectionRating: data.rating,
        violations: data.violations.filter(v => v.violation_label),
      });
      toast.success('Report saved');
      onSaved();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Parse failed — enter details manually</span>
        </div>
        <button onClick={onRemove} className="text-xs text-destructive hover:underline">Remove</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Inspection Date *</p>
          <Input type="date" value={data.date} onChange={e => setData(d => ({ ...d, date: e.target.value }))} className="h-8 text-xs" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Inspector Name *</p>
          <Input value={data.inspector} onChange={e => setData(d => ({ ...d, inspector: e.target.value }))} placeholder="e.g. J. Rodriguez" className="h-8 text-xs" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Inspection Type *</p>
          <Select value={data.type} onValueChange={v => setData(d => ({ ...d, type: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>{INSPECTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Rating *</p>
          <Select value={data.rating} onValueChange={v => setData(d => ({ ...d, rating: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Satisfactory">Satisfactory</SelectItem>
              <SelectItem value="Unsatisfactory">Unsatisfactory</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mb-3">
        <p className="text-xs text-muted-foreground mb-2">Violations</p>
        <div className="space-y-2">
          {data.violations.map((v, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 items-center">
              <Input value={v.violation_label} onChange={e => updateViolation(i, 'violationLabel', e.target.value)} placeholder="Label" className="h-7 text-xs" />
              <Input value={v.location_in_property} onChange={e => updateViolation(i, 'locationInProperty', e.target.value)} placeholder="Location" className="h-7 text-xs" />
              <Input value={v.corrective_action} onChange={e => updateViolation(i, 'correctiveAction', e.target.value)} placeholder="Corrective action" className="h-7 text-xs" />
              <div className="flex gap-1">
                <Input type="date" value={v.due_date} onChange={e => updateViolation(i, 'dueDate', e.target.value)} className="h-7 text-xs flex-1" />
                <button onClick={() => removeViolation(i)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addViolation} className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
          <Plus className="w-3 h-3" /> Add violation
        </button>
      </div>
      <Button onClick={handleSave} disabled={saving} size="sm" className="w-full gap-2">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
        Save & Import
      </Button>
    </div>
  );
}

function ReportCard({ report, onDelete }: { report: ImportedReport; onDelete: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const topViolations = report.violations.slice(0, 3);
  const extra = report.violations.length - 3;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteImportedReport({ reportId: report.id });
      toast.success('Report deleted');
      onDelete();
    } catch { toast.error('Failed to delete'); setDeleting(false); }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground">{report.reportTitle ?? 'Imported Report'}</span>
              <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                {report.parsingStatus === 'Manual'
                  ? 'Manual'
                  : !report.pdfUrl
                    ? 'Parsed — No PDF'
                    : 'Imported'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {[report.inspectorName && `Inspector: ${report.inspectorName}`, report.inspection_rating, report.violation_count != null && `${report.violation_count} violation${report.violation_count !== 1 ? 's' : ''}`].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs ml-3 flex-shrink-0">
            {report.pdfUrl && (
              <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> PDF
              </a>
            )}
            <button onClick={() => setConfirmDelete(true)} disabled={deleting} className="text-destructive hover:underline flex items-center gap-1">
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            </button>
          </div>
        </div>
        {topViolations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {topViolations.map((v, i) => (
              <span key={i} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {[v.violation_label, v.location_in_property].filter(Boolean).join(' · ')}
              </span>
            ))}
            {extra > 0 && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">+{extra} more</span>}
          </div>
        )}
        {!report.pdfUrl && report.parsingStatus !== 'Manual' && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Info className="w-3 h-3 flex-shrink-0" />
            Original file was too large to store — compress it below 25 MB and re-upload for a viewable link
          </p>
        )}
        {report.uploadedBy && (
          <p className="text-xs text-muted-foreground mt-2">Uploaded by {report.uploadedBy} · {fmt(report.uploaded_at?.slice(0, 10))}</p>
        )}
      </div>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete imported report?</AlertDialogTitle>
            <AlertDialogDescription>This will delete the report record, its linked inspection, and all extracted violations. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function ImportedReportsTab({ locationId }: { locationId: string }) {
  const { user } = useAuth();
  const [reports, setReports] = useState<ImportedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadReports = async () => {
    try {
      const res = await getImportedReports({ locationId });
      setReports(res.reports);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReports(); }, [locationId]); // eslint-disable-line

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) { toast.error(`${file.name} is not a PDF`); return; }

    const fileSizeMB = file.size / (1024 * 1024);
    const MAX_PARSE_MB = 60;
    const MAX_UPLOAD_MB = 25;

    if (file.size > MAX_PARSE_MB * 1024 * 1024) {
      toast.error(`${file.name} is ${fileSizeMB.toFixed(1)} MB — files above ${MAX_PARSE_MB} MB cannot be processed`);
      return;
    }

    const parseOnly = file.size > MAX_UPLOAD_MB * 1024 * 1024;
    const tempId = `${Date.now()}-${file.name}`;
    setPending(p => [...p, { tempId, fileName: file.name, status: 'uploading', parseOnly, fileSizeMB }]);

    try {
      let fileUrl: string | undefined;

      if (!parseOnly) {
        const upload = await uploadFile({ data: file, filename: file.name });
        fileUrl = upload.fileUrl;
      }

      setPending(p => p.map(x => x.tempId === tempId ? { ...x, status: 'parsing' } : x));

      // Chunked base64 conversion — much faster than char-by-char for large files
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const CHUNK = 8192;
      for (let i = 0; i < bytes.byteLength; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const pdfBase64 = btoa(binary);

      const result = await importReportPdf({
        locationId,
        pdfUrl: fileUrl,
        pdfBase64,
        fileName: file.name,
        uploadedBy: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email : 'Unknown',
      });

      setPending(p => p.filter(x => x.tempId !== tempId));

      if (result.parsingStatus === 'Failed') {
        setManualEntries(m => [...m, { reportId: result.id, date: '', inspector: '', type: '', rating: '', violations: [] }]);
        toast.error(`Could not auto-parse ${file.name} — fill in manually`);
      } else if (parseOnly) {
        toast.success(`${file.name} parsed (${fileSizeMB.toFixed(1)} MB — original not stored)`);
      } else {
        toast.success(`${file.name} imported successfully`);
      }
      await loadReports();
    } catch {
      setPending(p => p.map(x => x.tempId === tempId ? { ...x, status: 'failed' } : x));
      toast.error(`Failed to process ${file.name}`);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(processFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading reports…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'}`}
      >
        <UploadCloud className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground mb-1">Drop inspection report PDFs here</p>
        <p className="text-xs text-muted-foreground">PDF only · up to 60 MB · files over 25 MB are parsed without storing the original</p>
        <Button size="sm" variant="outline" className="mt-3 pointer-events-none">Browse files</Button>
        <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden"
          onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
      </div>

      {/* Pending uploads */}
      {pending.map(p => (
        <div key={p.tempId} className="bg-card border border-border rounded-xl p-4 opacity-70">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{p.fileName}</p>
              {p.parseOnly && (
                <p className="text-xs text-muted-foreground">
                  {p.fileSizeMB != null ? `${p.fileSizeMB.toFixed(1)} MB · ` : ''}parsing only — file too large to store
                </p>
              )}
            </div>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex-shrink-0">
              {p.status === 'uploading' ? (p.parseOnly ? 'Reading…' : 'Uploading…') : 'Parsing…'}
            </span>
          </div>
        </div>
      ))}

      {/* Manual entry forms */}
      {manualEntries.map(entry => (
        <ManualEntryForm
          key={entry.reportId}
          entry={entry}
          locationId={locationId}
          onSaved={async () => {
            setManualEntries(m => m.filter(e => e.reportId !== entry.reportId));
            await loadReports();
          }}
          onRemove={() => setManualEntries(m => m.filter(e => e.reportId !== entry.reportId))}
        />
      ))}

      {/* Report cards */}
      {reports.length === 0 && pending.length === 0 && manualEntries.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm font-medium text-muted-foreground">No imported reports yet</p>
          <p className="text-xs text-muted-foreground mt-1">Upload previous inspection PDFs above</p>
        </div>
      ) : (
        reports.map(r => (
          <ReportCard key={r.id} report={r} onDelete={loadReports} />
        ))
      )}
    </div>
  );
}
