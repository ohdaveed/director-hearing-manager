import { useState, useRef, useCallback } from 'react';
import { bulkImportComplaints } from 'zite-endpoints-sdk';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle2, AlertCircle, Download, X, Loader2 } from 'lucide-react';

// ── CSV parsing ───────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim()); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

const HEADER_MAP: Record<string, string> = {
  // Address
  'address': 'address',
  // Date Received
  'date received': 'dateReceived', 'date_received': 'dateReceived', 'datereceived': 'dateReceived',
  // Description / Complaint Details
  'description': 'description', 'complaint details': 'description', 'complaint_details': 'description',
  // Complaint ID / Number
  'complaint id': 'complaintId', 'complaint_id': 'complaintId', 'complaintid': 'complaintId',
  'complaint number': 'complaintId', 'complaint_number': 'complaintId', 'complaintnumber': 'complaintId',
  // 311 Case Number
  '311 case #': 'caseNumber311', '311 case number': 'caseNumber311', 'casenumber311': 'caseNumber311',
  '311 case_number': 'caseNumber311',
  // Complaint Type
  'complaint type': 'complaintType', 'complaint_type': 'complaintType', 'complainttype': 'complaintType',
  // Category
  'category': 'category', 'categories': 'category',
  'complaint category': 'category', 'complaint_category': 'category',
  // Assigned Inspector / To
  'assigned inspector': 'assignedTo', 'inspector': 'assignedTo', 'assigned_inspector': 'assignedTo',
  'assignedto': 'assignedTo', 'assigned to': 'assignedTo', 'assigned_to': 'assignedTo',
  // Status
  'status': 'status',
  // Method Received
  'method received': 'methodReceived', 'method_received': 'methodReceived',
  // Assigned Program / EHB Program
  'assigned program': 'assignedProgram', 'assigned_program': 'assignedProgram',
  'ehb program': 'assignedProgram', 'ehb_program': 'assignedProgram',
  // Date Assigned
  'date assigned': 'dateAssigned', 'date_assigned': 'dateAssigned',
  // Location ID
  'location id': 'locationId', 'location_id': 'locationId', 'locationid': 'locationId',
};

/** Normalize date strings to YYYY-MM-DD. Handles MM/DD/YYYY and YYYY-MM-DD. */
function normalizeDate(raw: string): string {
  const trimmed = raw.trim();
  // MM/DD/YYYY
  const mdyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Already YYYY-MM-DD or parseable
  return trimmed;
}

type ParsedRow = {
  rowNum: number;
  address: string;
  dateReceived: string;
  description: string;
  complaintId?: string;
  caseNumber311?: string;
  complaintType?: string;
  category?: string;
  assignedTo?: string;
  status?: string;
  methodReceived?: string;
  assignedProgram?: string;
  dateAssigned?: string;
  locationId?: string;
  errors: string[];
  valid: boolean;
};

function parseCSV(text: string): { rows: ParsedRow[]; strippedCount: number } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { rows: [], strippedCount: 0 };
  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(h => HEADER_MAP[h.toLowerCase().trim()] ?? h.toLowerCase().trim());

  const allRows: ParsedRow[] = lines.slice(1).map((line, i) => {
    const values = parseCSVLine(line);
    const mapped: Record<string, string> = {};
    headers.forEach((h, j) => { mapped[h] = values[j] ?? ''; });

    const errors: string[] = [];
    if (!mapped.address?.trim()) errors.push('Address missing');
    const normalizedDate = mapped.dateReceived?.trim() ? normalizeDate(mapped.dateReceived) : '';
    if (!mapped.dateReceived?.trim()) errors.push('Date Received missing');
    else if (isNaN(new Date(normalizedDate).getTime())) errors.push('Date Received invalid');
    if (!mapped.description?.trim()) errors.push('Description missing');

    return {
      rowNum: i + 1,
      address: mapped.address ?? '',
      dateReceived: normalizedDate,
      description: mapped.description ?? '',
      complaintId: mapped.complaintId || undefined,
      caseNumber311: mapped.caseNumber311 || undefined,
      complaintType: mapped.complaintType || undefined,
      category: mapped.category || undefined,
      assignedTo: mapped.assignedTo || undefined,
      status: mapped.status || undefined,
      methodReceived: mapped.methodReceived || undefined,
      assignedProgram: mapped.assignedProgram || undefined,
      dateAssigned: mapped.dateAssigned || undefined,
      locationId: mapped.locationId || undefined,
      errors,
      valid: errors.length === 0,
    };
  });

  // Strip rows where ALL key fields are empty — catches EHB footer metadata and blank lines
  const dataRows = allRows.filter(r =>
    r.address.trim() || r.dateReceived.trim() || r.description.trim() || r.complaintId?.trim()
  );
  const strippedCount = allRows.length - dataRows.length;

  // Detect within-file duplicate Complaint Numbers
  const seenIds = new Map<string, number>(); // normalised id → first rowNum
  const rows = dataRows.map(r => {
    if (!r.complaintId?.trim()) return r;
    const key = r.complaintId.trim().toLowerCase();
    if (seenIds.has(key)) {
      const firstRow = seenIds.get(key)!;
      return {
        ...r,
        errors: [...r.errors, `Duplicate Complaint Number "${r.complaintId}" — first seen on row ${firstRow}`],
        valid: false,
      };
    }
    seenIds.set(key, r.rowNum);
    return r;
  });

  return { rows, strippedCount };
}

const TEMPLATE_CSV = [
  'Complaint Number,Location ID,Address,Date Received,Complaint Details,311 Case Number,Complaint Type,Complaint Category,Assigned To,Status,Method Received,EHB Program',
  ',,543 Mission St San Francisco CA 94105,09/17/2025,Rodent activity in rear yard and garbage area.,101003863001,Vector Control,Animals and Pests,David Arrizon,Open,311,Healthy Housing and Vector Control',
  ',LOC-12345,1240 Valencia St San Francisco CA 94110,05/02/2025,Tenant reports mold growth in bathroom ceiling.,,,Building Conditions,David Arrizon,Open,Phone,Healthy Housing and Vector Control',
].join('\n');

// ── Sub-components ────────────────────────────────────────────────────────────

function DropZone({ onFile, hasFile }: { onFile: (file: File) => void; hasFile: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) onFile(file);
    else toast.error('Please drop a .csv file');
  }, [onFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl bg-card flex flex-col items-center justify-center py-14 gap-3 text-center cursor-pointer transition-colors ${
        dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
      }`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${dragging ? 'bg-primary/10' : 'bg-muted'}`}>
        <Upload className={`w-6 h-6 ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <div>
        <p className="font-semibold text-foreground">{hasFile ? 'Drop a new file to replace' : 'Drop a CSV file here'}</p>
        <p className="text-sm text-muted-foreground mt-0.5">or click to browse your files</p>
      </div>
      <p className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
        Required columns: <strong>Address</strong>, <strong>Date Received</strong>, <strong>Complaint Details</strong>
      </p>
      <input ref={inputRef} type="file" accept=".csv" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </div>
  );
}

function PreviewTable({ rows, onClear }: { rows: ParsedRow[]; onClear: () => void }) {
  const valid = rows.filter(r => r.valid).length;
  const invalid = rows.length - valid;
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{rows.length} row{rows.length !== 1 ? 's' : ''} detected</span>
          {valid > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{valid} ready</span>}
          {invalid > 0 && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">{invalid} error{invalid !== 1 ? 's' : ''}</span>}
        </div>
        <button onClick={onClear} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 sticky top-0">
            <tr className="text-left text-muted-foreground">
              <th className="px-3 py-2 font-semibold">Row</th>
              <th className="px-3 py-2 font-semibold">Address</th>
              <th className="px-3 py-2 font-semibold">Date Received</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(row => (
              <tr key={row.rowNum} className={row.valid ? '' : 'bg-destructive/5'}>
                <td className="px-3 py-2.5 text-muted-foreground font-mono">{row.rowNum}</td>
                <td className="px-3 py-2.5 max-w-[200px] truncate text-foreground" title={row.address}>{row.address || <span className="text-destructive italic">—</span>}</td>
                <td className="px-3 py-2.5">
                  {row.errors.some(e => e.includes('Date')) ? (
                    <span className="text-destructive italic">{row.dateReceived || 'Missing'}</span>
                  ) : row.dateReceived}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{row.complaintType || '—'}</td>
                <td className="px-3 py-2.5">
                  {row.valid ? (
                    <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Ready</span>
                  ) : (
                    <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full" title={row.errors.join(', ')}>
                      Error
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.some(r => !r.valid) && (
        <div className="px-5 py-2.5 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            <AlertCircle className="inline w-3 h-3 mr-1 text-destructive" />
            Rows with errors are skipped. Fix them in your spreadsheet and re-upload.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ImportComplaintsPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: { row: number; reason: string }[] } | null>(null);
  const [strippedCount, setStrippedCount] = useState(0);
  const [showStrippedBanner, setShowStrippedBanner] = useState(false);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const { rows: parsed, strippedCount: stripped } = parseCSV(text);
      if (parsed.length === 0) {
        toast.error('No data rows found. Check that your file has a header row and at least one data row.');
        return;
      }
      // Limit applies to real data rows only, after metadata stripping
      if (parsed.length > 200) {
        toast.error('Maximum 200 rows per import. Split your file and try again.');
        return;
      }
      setRows(parsed);
      setStrippedCount(stripped);
      setShowStrippedBanner(stripped > 0);
      setResult(null);
    };
    reader.readAsText(file);
  }, []);

  const handleImport = async () => {
    const validRows = rows.filter(r => r.valid);
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const res = await bulkImportComplaints({
        rows: validRows.map(r => ({
          address: r.address,
          dateReceived: r.dateReceived,
          description: r.description,
          complaintId: r.complaintId,
          caseNumber311: r.caseNumber311,
          complaintType: r.complaintType,
          category: r.category,
          assignedTo: r.assignedTo,
          status: r.status,
          methodReceived: r.methodReceived,
          assignedProgram: r.assignedProgram,
          dateAssigned: r.dateAssigned,
          locationId: r.locationId,
        })),
      });
      setResult(res);
      setRows([]);
      if (res.created > 0) toast.success(`Imported ${res.created} complaint${res.created !== 1 ? 's' : ''} successfully.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'complaint-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = rows.filter(r => r.valid).length;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Import Complaints from CSV</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Upload a spreadsheet to create multiple complaints at once.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={downloadTemplate}>
          <Download className="w-3.5 h-3.5" /> Template
        </Button>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`mb-6 rounded-xl p-5 border flex items-start gap-4 ${result.created > 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted border-border'}`}>
          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              {result.created} complaint{result.created !== 1 ? 's' : ''} imported
              {result.skipped > 0 ? `, ${result.skipped} skipped` : ''}
            </p>
            {result.errors.length > 0 && (
              <div className="mt-2 space-y-1">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-destructive">Row {e.row}: {e.reason}</p>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setResult(null)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div className="mb-6">
        <DropZone onFile={handleFile} hasFile={rows.length > 0} />
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <div className="space-y-4">
          {showStrippedBanner && (
            <div className="flex items-start justify-between gap-3 bg-muted border border-border rounded-lg px-4 py-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{strippedCount} row{strippedCount !== 1 ? 's' : ''} automatically removed</span>
                  {' '}— system-generated metadata (report header, filter settings, column config).
                </p>
              </div>
              <button onClick={() => setShowStrippedBanner(false)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-0.5 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <PreviewTable rows={rows} onClear={() => { setRows([]); setShowStrippedBanner(false); }} />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {validCount} of {rows.length} row{rows.length !== 1 ? 's' : ''} will be imported.
            </p>
            <Button onClick={handleImport} disabled={importing || validCount === 0} className="gap-2">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? 'Importing…' : `Import ${validCount} row${validCount !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      )}

      {/* Help */}
      {rows.length === 0 && !result && (
        <div className="mt-8 bg-muted/40 border border-border rounded-xl p-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Column Reference</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
            {[
              { col: 'Address', req: true }, { col: 'Date Received', req: true }, { col: 'Complaint Details', req: true },
              { col: 'Complaint Number', req: false }, { col: 'Location ID', req: false }, { col: '311 Case Number', req: false },
              { col: 'Complaint Type', req: false }, { col: 'Complaint Category', req: false }, { col: 'Assigned To', req: false },
              { col: 'Status', req: false }, { col: 'Method Received', req: false }, { col: 'EHB Program', req: false },
            ].map(({ col, req }) => (
              <div key={col} className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${req ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {req ? 'REQ' : 'OPT'}
                </span>
                <span className="text-xs text-foreground font-mono">{col}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Dates can be in <span className="font-mono">MM/DD/YYYY</span> or <span className="font-mono">YYYY-MM-DD</span> format.
            Column names are flexible — e.g. <span className="font-mono">Description</span> or <span className="font-mono">Complaint Details</span> both work.
            Download the template above to get started quickly.
          </p>
        </div>
      )}
    </div>
  );
}
