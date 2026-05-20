import { Trash2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Entry {
  id: string;
  entryDate?: string;
  entryType?: string;
  summary?: string;
}

interface Props {
  letter: string;
  fileName: string;
  category?: string;
  pageCount: number;
  pageRange: string;
  fileUrl?: string;
  entries: Entry[];
  onDelete: () => void;
  onLinkToEntry: (entryId: string) => void;
  isDeleting: boolean;
}

export default function ExhibitCard({
  letter,
  fileName,
  category,
  pageCount,
  pageRange,
  fileUrl,
  entries,
  onDelete,
  onLinkToEntry,
  isDeleting,
}: Props) {
  return (
    <div className="border border-border rounded-lg p-3 bg-card shadow-sm">
      <div className="flex items-start justify-between mb-1.5">
        <span className="text-xs font-black text-primary">Exhibit {letter}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">{pageCount} pg</span>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors disabled:opacity-40"
            title="Remove exhibit"
          >
            {isDeleting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-foreground truncate leading-snug" title={fileName}>
        {fileName}
      </p>

      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        {category && (
          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
            {category}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground font-mono">pp. {pageRange}</span>
        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary underline underline-offset-1 hover:no-underline"
          >
            View ↗
          </a>
        )}
      </div>

      {entries.length > 0 && (
        <div className="mt-2">
          <Select onValueChange={(v) => v && onLinkToEntry(v)}>
            <SelectTrigger className="h-6 text-[10px] w-full">
              <SelectValue placeholder="Link page range to row…" />
            </SelectTrigger>
            <SelectContent>
              {entries.map((e, i) => (
                <SelectItem key={e.id} value={e.id} className="text-[10px]">
                  {String.fromCharCode(65 + i)} — {e.entryType || "Entry"}
                  {e.entryDate ? ` (${e.entryDate})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
