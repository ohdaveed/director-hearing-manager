import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2 } from 'lucide-react';
import { VIOLATION_TYPES } from './violationTypes';
import { PHOTO_TYPE_THEME } from '@/utils/badgeThemes';

export type PhotoEntry = {
  id: string;
  localUrl: string;       // object URL for preview
  uploadedUrl: string;    // permanent URL after upload
  uploading: boolean;
  error?: string;
  photoType: 'Violation' | 'Abatement' | 'Memo of Visit' | 'General';
  violationLabel: string;
  caption: string;
  savedToDb: boolean;
};

type Props = {
  photo: PhotoEntry;
  onChange: (id: string, field: keyof PhotoEntry, value: string) => void;
  onRemove: (id: string) => void;
};

export default function PhotoCard({ photo, onChange, onRemove }: Props) {
  const showViolationSelect = photo.photo_type === 'Violation' || photo.photo_type === 'Abatement';
  const violationLabels = VIOLATION_TYPES.map(v => v.label);
  const uniqueLabels = [...new Set(violationLabels)];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-muted">
        <img src={photo.localUrl} alt={photo.caption || 'Inspection photo'} className="w-full h-full object-cover" />
        {photo.uploading && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        <button
          type="button"
          onClick={() => onRemove(photo.id)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        {photo.savedToDb && (
          <span className="absolute bottom-2 left-2 text-[10px] bg-success/90 text-background px-1.5 py-0.5 rounded font-medium">Saved</span>
        )}
        {photo.error && (
          <span className="absolute bottom-2 left-2 text-[10px] bg-destructive/90 text-destructive-foreground px-1.5 py-0.5 rounded font-medium">{photo.error}</span>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2 flex-1">
        {/* Type Badge */}
        <div className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${PHOTO_TYPE_THEME[photo.photo_type]}`}>
          {photo.photo_type}
        </div>

        <Select value={photo.photo_type} onValueChange={v => onChange(photo.id, 'photoType', v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Violation">Violation</SelectItem>
            <SelectItem value="Abatement">Abatement</SelectItem>
            <SelectItem value="Memo of Visit">Memo of Visit</SelectItem>
            <SelectItem value="General">General</SelectItem>
          </SelectContent>
        </Select>

        {showViolationSelect && (
          <Select value={photo.violation_label} onValueChange={v => onChange(photo.id, 'violationLabel', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Link to violation..." />
            </SelectTrigger>
            <SelectContent>
              {uniqueLabels.map(label => (
                <SelectItem key={label} value={label}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Input
          placeholder="Add caption..."
          value={photo.caption}
          onChange={e => onChange(photo.id, 'caption', e.target.value)}
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}
