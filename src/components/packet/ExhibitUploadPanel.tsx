import { useState, useRef, useCallback } from 'react';

import { exhibitService } from '@/services/exhibitService';
import { chronoService } from '@/services/chronoService';
import { CloudUpload, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import ExhibitCard from './ExhibitCard';

type ExhibitType = any;
type EntryType = any;

function entryLetter(idx: number) {
  return idx < 26 ? String.fromCharCode(65 + idx) : `(${idx + 1})`;
}

function computePageRanges(exhibits: ExhibitType[], batesStart: number): Record<string, string> {
  const map: Record<string, string> = {};
  let offset = batesStart;
  for (const ex of exhibits) {
    const count = ex.pageCount ?? 1;
    const end = offset + count - 1;
    map[ex.id] = `${String(offset).padStart(3, '0')}–${String(end).padStart(3, '0')}`;
    offset += count;
  }
  return map;
}

const ACCEPTED = '.pdf,.jpg,.jpeg,.png';
const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];

interface BatchState {
  total: number;
  current: number;
  currentFileName: string;
}

interface Props {
  exhibits: ExhibitType[];
  entries: EntryType[];
  complaintId: string;
  batesStart: number;
  onExhibitsChange: (exhibits: ExhibitType[]) => void;
  onEntryPageRefUpdated: () => void;
}

export default function ExhibitUploadPanel({
  exhibits, entries, complaintId, batesStart,
  onExhibitsChange, onEntryPageRefUpdated,
}: Props) {
  const [batch, setBatch] = useState<BatchState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [failedFiles, setFailedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sorted = [...exhibits].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  const pageRanges = computePageRanges(sorted, batesStart);
  const totalPages = sorted.reduce((sum, ex) => sum + (ex.pageCount ?? 1), 0);
  const isUploading = batch !== null;

  const uploadSingleFile = async (
    file: File,
  ): Promise<{ success: boolean; exhibit?: ExhibitType }> => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTS.includes(ext)) return { success: false };
    try {
      const { fileUrl } = await uploadFile({ data: file, filename: file.name });
      const result = await exhibitService.uploadExhibit({ complaintId, fileUrl, fileName: file.name });
      return { success: true, exhibit: result.exhibit as ExhibitType };
    } catch {
      return { success: false };
    }
  };

  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const validFiles = files.filter(f => {
      const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
      return ALLOWED_EXTS.includes(ext);
    });

    if (validFiles.length === 0) {
      toast.error('No supported files — use PDF, JPG, or PNG');
      return;
    }

    const failed: string[] = [];
    setFailedFiles([]);
    let currentExhibits = [...exhibits];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setBatch({ total: validFiles.length, current: i + 1, currentFileName: file.name });

      const result = await uploadSingleFile(file);
      if (result.success && result.exhibit) {
        currentExhibits = [...currentExhibits, result.exhibit];
        onExhibitsChange(currentExhibits);
      } else {
        failed.push(file.name);
      }
    }

    setBatch(null);

    if (failed.length === 0) {
      toast.success(
        validFiles.length === 1
          ? 'Exhibit uploaded'
          : `${validFiles.length} exhibits uploaded`
      );
    } else if (failed.length < validFiles.length) {
      toast.success(`${validFiles.length - failed.length} of ${validFiles.length} exhibits uploaded`);
      setFailedFiles(failed);
    } else {
      toast.error('All uploads failed. Please try again.');
      setFailedFiles(failed);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId, exhibits, onExhibitsChange]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) processFiles(files);
  };

  const handleDelete = async (exhibitId: string) => {
    setDeletingId(exhibitId);
    try {
      await exhibitService.deleteExhibit({ exhibitId });
      onExhibitsChange(exhibits.filter(ex => ex.id !== exhibitId));
      toast.success('Exhibit removed');
    } catch {
      toast.error('Failed to remove exhibit');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLinkToEntry = async (exhibitId: string, entryId: string) => {
    const pageRange = pageRanges[exhibitId];
    if (!pageRange) return;
    try {
      await chronoService.updateChronologyEntry({ entryId, attachmentPageRef: pageRange });
      onEntryPageRefUpdated();
      toast.success('Page range linked to chronology row');
    } catch {
      toast.error('Failed to link page range');
    }
  };

  const progress = batch ? Math.round((batch.current / batch.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-bold text-foreground">Exhibits</h3>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {sorted.length} file{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors flex-shrink-0 ${
          isDragging ? 'border-primary/60 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/20'
        } ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={e => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) processFiles(files);
            e.target.value = '';
          }}
        />
        <CloudUpload className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground opacity-40" />
        <p className="text-[10px] text-muted-foreground font-medium">
          Drop files or click to browse
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          PDF, JPG, PNG · Multiple files OK
        </p>
      </div>

      {/* Batch upload progress */}
      {batch && (
        <div className="border border-border rounded-lg p-3 bg-muted/20 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              Uploading {batch.current} of {batch.total}…
            </span>
            <span className="text-[10px] text-muted-foreground">{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 truncate">{batch.currentFileName}</p>
        </div>
      )}

      {/* Failed uploads summary */}
      {failedFiles.length > 0 && (
        <div className="border border-destructive/30 rounded-lg p-3 bg-destructive/5 flex-shrink-0">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-destructive">
                {failedFiles.length} file{failedFiles.length !== 1 ? 's' : ''} failed
              </p>
              {failedFiles.slice(0, 3).map(f => (
                <p key={f} className="text-[10px] text-muted-foreground truncate">{f}</p>
              ))}
              {failedFiles.length > 3 && (
                <p className="text-[10px] text-muted-foreground">…and {failedFiles.length - 3} more</p>
              )}
            </div>
            <button
              onClick={() => setFailedFiles([])}
              className="text-[10px] text-muted-foreground ml-auto flex-shrink-0 hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Exhibit cards */}
      <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
        {sorted.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <p className="text-xs font-medium">No exhibits yet</p>
            <p className="text-[10px] mt-0.5">Drop files above to get started</p>
          </div>
        )}
        {sorted.map((ex, idx) => (
          <ExhibitCard
            key={ex.id}
            letter={entryLetter(idx)}
            fileName={ex.exhibit_label ?? ex.description ?? 'Untitled'}
            category={ex.category}
            pageCount={ex.pageCount ?? 1}
            pageRange={pageRanges[ex.id] || '???'}
            fileUrl={ex.file?.[0]?.url}
            entries={entries}
            onDelete={() => handleDelete(ex.id)}
            onLinkToEntry={entryId => handleLinkToEntry(ex.id, entryId)}
            isDeleting={deletingId === ex.id}
          />
        ))}
      </div>

      {/* Running page tally */}
      {sorted.length > 0 && (
        <div className="bg-muted/40 rounded-lg p-3 text-[10px] space-y-1.5 border border-border flex-shrink-0">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total exhibits</span>
            <span className="font-bold text-foreground">{sorted.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total pages</span>
            <span className="font-bold text-foreground">{totalPages}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bates range</span>
            <span className="font-bold text-foreground font-mono">
              {String(batesStart).padStart(3, '0')}–{String(batesStart + Math.max(totalPages - 1, 0)).padStart(3, '0')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
