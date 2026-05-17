import { useState, useMemo } from 'react';
import { savePacketSelections, GetHearingPacketDataOutputType } from 'zite-endpoints-sdk';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, FileText, Image, ExternalLink } from 'lucide-react';

type PacketData = GetHearingPacketDataOutputType;

function fmt(d?: string) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString();
}

type EvidenceItem = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  pdfUrl?: string;
};

type PhotoGroup = { inspectionDate?: string; photos: PacketData['allPhotos'] };

function EvidenceRow({ item, checked, onToggle }: { item: EvidenceItem; checked: boolean; onToggle: () => void }) {
  return (
    <label className={`flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer transition-colors ${checked ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/40'}`}>
      <Checkbox checked={checked} onCheckedChange={onToggle} className="mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-sm font-medium text-foreground">{item.title}</span>
          <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full flex-shrink-0">{item.tag}</span>
        </div>
        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
      </div>
      {item.pdfUrl && (
        <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-xs text-primary flex items-center gap-1 flex-shrink-0">
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </label>
  );
}

function PhotoThumb({ photo, checked, onToggle }: {
  photo: PacketData['allPhotos'][0]; checked: boolean; onToggle: () => void;
}) {
  return (
    <label className="relative cursor-pointer group">
      <div className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${checked ? 'border-primary' : 'border-transparent'}`}>
        {photo.photoUrl ? (
          <img src={photo.photoUrl} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Image className="w-5 h-5 text-muted-foreground opacity-40" />
          </div>
        )}
        <div className={`absolute inset-0 rounded-lg ${checked ? 'bg-primary/10' : ''}`} />
      </div>
      <div className="absolute top-1.5 left-1.5">
        <Checkbox checked={checked} onCheckedChange={onToggle} className="bg-background/90 border-border" />
      </div>
      <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption ?? photo.photoType ?? 'Photo'}</p>
    </label>
  );
}

export default function AttachmentsEvidenceTab({ packetId, data }: {
  packetId: string;
  data: PacketData;
}) {
  // selectedReportIds / selectedPhotoIds are now typed arrays from linked record fields
  const savedReportIds = data.packet.selectedReportIds ?? [];
  const savedPhotoIds = data.packet.selectedPhotoIds ?? [];

  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(() => new Set(savedReportIds));
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(() => new Set(savedPhotoIds));
  const [saving, setSaving] = useState(false);

  // Build evidence items: imported reports + exhibits
  const evidenceItems: EvidenceItem[] = useMemo(() => {
    const items: EvidenceItem[] = [];
    for (const r of data.importedReports) {
      items.push({
        id: `report:${r.id}`,
        title: r.reportTitle ?? 'Imported Report',
        subtitle: [r.inspectorName, r.inspectionRating, r.violationCount != null ? `${r.violationCount} violations` : ''].filter(Boolean).join(' · '),
        tag: 'Imported PDF',
        pdfUrl: r.pdfUrl,
      });
    }
    for (const ex of data.exhibits) {
      items.push({
        id: `exhibit:${ex.id}`,
        title: ex.exhibitLabel ?? ex.description ?? 'Exhibit',
        subtitle: [`${ex.category ?? ex.exhibitType ?? ''}`, ex.exhibitDate ? fmt(ex.exhibitDate) : ''].filter(Boolean).join(' · '),
        tag: 'Exhibit',
        pdfUrl: ex.file?.[0]?.url,
      });
    }
    return items;
  }, [data.importedReports, data.exhibits]);

  // Group photos by inspection date
  const photoGroups: PhotoGroup[] = useMemo(() => {
    const groups = new Map<string, PacketData['allPhotos']>();
    for (const p of data.allPhotos) {
      const key = p.inspectionDate ?? 'Unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, photos]) => ({ inspectionDate: key === 'Unknown' ? undefined : key, photos }));
  }, [data.allPhotos]);

  const allPhotoIds = data.allPhotos.map(p => p.id);

  const toggleReport = (id: string) => setSelectedReportIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const togglePhoto = (id: string) => setSelectedPhotoIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePacketSelections({
        packetId,
        selectedReportIds: Array.from(selectedReportIds),
        selectedPhotoIds: Array.from(selectedPhotoIds),
      });
      toast.success('Selections saved');
    } catch { toast.error('Failed to save selections'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-320px)]">
      {/* Evidence & Reports */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Evidence &amp; Reports</span>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{evidenceItems.length}</span>
          </div>
          <span className="text-xs text-muted-foreground">Select to include in packet</span>
        </div>
        {evidenceItems.length === 0 ? (
          <p className="text-xs text-muted-foreground italic bg-muted/30 rounded-lg px-3 py-4 text-center">
            No imported reports or exhibits found for this location
          </p>
        ) : (
          <div className="space-y-2">
            {evidenceItems.map(item => (
              <EvidenceRow
                key={item.id}
                item={item}
                checked={selectedReportIds.has(item.id)}
                onToggle={() => toggleReport(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Photos</span>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{data.allPhotos.length}</span>
          </div>
          {data.allPhotos.length > 0 && (
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedPhotoIds(new Set(allPhotoIds))} className="text-xs text-primary hover:underline">Select all</button>
              <button onClick={() => setSelectedPhotoIds(new Set())} className="text-xs text-muted-foreground hover:underline">Deselect all</button>
            </div>
          )}
        </div>
        {data.allPhotos.length === 0 ? (
          <p className="text-xs text-muted-foreground italic bg-muted/30 rounded-lg px-3 py-4 text-center">No photos on file for this complaint</p>
        ) : (
          <div className="space-y-4">
            {photoGroups.map((group, gi) => (
              <div key={gi}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {group.inspectionDate ? `Inspection — ${fmt(group.inspectionDate)}` : 'Unassigned'} ({group.photos.length} photo{group.photos.length !== 1 ? 's' : ''})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {group.photos.map(p => (
                    <PhotoThumb key={p.id} photo={p} checked={selectedPhotoIds.has(p.id)} onToggle={() => togglePhoto(p.id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Save Selections
      </Button>
    </div>
  );
}
