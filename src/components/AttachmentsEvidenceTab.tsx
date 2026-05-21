import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle2, FileText, Image, ExternalLink, ClipboardList } from "lucide-react";
import InspectionImportWizard from "@/components/InspectionImportWizard";
import { packetService } from "@/services/packetService";
import { SectionHeader } from "@/components/ui/section-header";

type PacketData = any;

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString();
}

type EvidenceItem = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  pdfUrl?: string;
};

type PhotoGroup = { inspectionDate?: string; photos: PacketData["allPhotos"] };

function EvidenceRow({
  item,
  checked,
  onToggle,
}: {
  item: EvidenceItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer transition-colors",
        checked ? "bg-primary/5 border-primary/20" : "hover:bg-muted/40",
      )}
    >
      <Checkbox checked={checked} onCheckedChange={onToggle} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-sm font-medium text-foreground">{item.title}</span>
          <Badge variant="secondary" className="text-[10px] font-normal px-1.5 h-4">
            {item.tag}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
      </div>
      {item.pdfUrl && (
        <a
          href={item.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-primary flex items-center gap-1 shrink-0"
        >
          <ExternalLink data-icon="inline-start" />
        </a>
      )}
    </label>
  );
}

function PhotoThumb({
  photo,
  checked,
  onToggle,
}: {
  photo: PacketData["allPhotos"][0];
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="relative cursor-pointer group">
      <div
        className={cn(
          "aspect-square rounded-lg overflow-hidden border-2 transition-colors",
          checked ? "border-primary" : "border-transparent",
        )}
      >
        {photo.photo_url ? (
          <img
            src={photo.photo_url}
            alt={photo.caption ?? ""}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Image className="shrink-0 text-muted-foreground opacity-40" />
          </div>
        )}
        <div className={cn("absolute inset-0 rounded-lg", checked ? "bg-primary/10" : "")} />
      </div>
      <div className="absolute top-1.5 left-1.5">
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          className="bg-background/90 border-border"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1 truncate">
        {photo.caption ?? photo.photo_type ?? "Photo"}
      </p>
    </label>
  );
}

export default function AttachmentsEvidenceTab({
  packetId,
  data,
}: {
  packetId: string;
  data: PacketData;
}) {
  const savedReportIds = data.packet.selected_report_ids ?? [];
  const savedPhotoIds = data.packet.selected_photo_ids ?? [];

  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(
    () => new Set(savedReportIds),
  );
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(
    () => new Set(savedPhotoIds),
  );
  const [saving, setSaving] = useState(false);
  const [importWizardOpen, setImportWizardOpen] = useState(false);

  const evidenceItems: EvidenceItem[] = useMemo(() => {
    const items: EvidenceItem[] = [];
    for (const r of data.importedReports) {
      items.push({
        id: `report:${r.id}`,
        title: r.reportTitle ?? "Imported Report",
        subtitle: [
          r.inspectorName,
          r.inspection_rating,
          r.violation_count != null ? `${r.violation_count} violations` : "",
        ]
          .filter(Boolean)
          .join(" · "),
        tag: "Imported PDF",
        pdfUrl: r.pdfUrl,
      });
    }
    for (const ex of data.exhibits) {
      items.push({
        id: `exhibit:${ex.id}`,
        title: ex.exhibitLabel ?? ex.description ?? "Exhibit",
        subtitle: [
          `${ex.category ?? ex.exhibitType ?? ""}`,
          ex.exhibitDate ? fmt(ex.exhibitDate) : "",
        ]
          .filter(Boolean)
          .join(" · "),
        tag: "Exhibit",
        pdfUrl: ex.file?.[0]?.url,
      });
    }
    return items;
  }, [data.importedReports, data.exhibits]);

  const photoGroups: PhotoGroup[] = useMemo(() => {
    const groups = new Map<string, PacketData["allPhotos"]>();
    for (const p of data.allPhotos) {
      const key = p.inspection_date ?? "Unknown";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, photos]) => ({
        inspectionDate: key === "Unknown" ? undefined : key,
        photos,
      }));
  }, [data.allPhotos]);

  const allPhotoIds = data.allPhotos.map((p: any) => p.id);

  const toggleReport = (id: string) =>
    setSelectedReportIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePhoto = (id: string) =>
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      await packetService.update(packetId, {
        selected_report_ids: [...selectedReportIds],
        selected_photo_ids: [...selectedPhotoIds],
      });
      toast.success("Selections saved");
    } catch {
      toast.error("Failed to save selections");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-320px)]">
      {/* Import Inspections */}
      <Card>
        <CardContent className="flex items-center justify-between p-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground leading-none">
              Import Inspection Reports
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
              Add submitted inspections with photos to this packet
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 h-8 ml-3"
            onClick={() => setImportWizardOpen(true)}
          >
            <ClipboardList data-icon="inline-start" />
            Import
          </Button>
        </CardContent>
      </Card>

      {/* Evidence & Reports */}
      <Card>
        <CardHeader className="p-5 pb-0">
          <SectionHeader
            icon={<FileText />}
            title="Evidence & Reports"
            count={evidenceItems.length}
            right={
              <span className="text-xs text-muted-foreground">Select to include in packet</span>
            }
          />
        </CardHeader>
        <CardContent className="p-5 pt-2">
          {evidenceItems.length === 0 ? (
            <p className="text-xs text-muted-foreground italic bg-muted/30 rounded-lg px-3 py-4 text-center">
              No imported reports or exhibits found for this location
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {evidenceItems.map((item) => (
                <EvidenceRow
                  key={item.id}
                  item={item}
                  checked={selectedReportIds.has(item.id)}
                  onToggle={() => toggleReport(item.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader className="p-5 pb-0">
          <SectionHeader
            icon={<Image />}
            title="Photos"
            count={data.allPhotos.length}
            right={
              data.allPhotos.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedPhotoIds(new Set(allPhotoIds))}
                    className="text-xs text-primary hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    onClick={() => setSelectedPhotoIds(new Set())}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Deselect all
                  </button>
                </div>
              )
            }
          />
        </CardHeader>
        <CardContent className="p-5 pt-2">
          {data.allPhotos.length === 0 ? (
            <p className="text-xs text-muted-foreground italic bg-muted/30 rounded-lg px-3 py-4 text-center">
              No photos on file for this complaint
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {photoGroups.map((group, gi) => (
                <div key={gi}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {group.inspectionDate
                      ? `Inspection — ${fmt(group.inspectionDate)}`
                      : "Unassigned"}{" "}
                    ({group.photos.length} photo
                    {group.photos.length !== 1 ? "s" : ""})
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {group.photos.map((p: any) => (
                      <PhotoThumb
                        key={p.id}
                        photo={p}
                        checked={selectedPhotoIds.has(p.id)}
                        onToggle={() => togglePhoto(p.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <CheckCircle2 data-icon="inline-start" />
        )}
        Save Selections
      </Button>

      <InspectionImportWizard
        packetId={packetId}
        open={importWizardOpen}
        onClose={() => setImportWizardOpen(false)}
        onImportComplete={() => {
          setImportWizardOpen(false);
          toast.success("Inspections imported — refresh to see updated exhibits");
        }}
      />
    </div>
  );
}
