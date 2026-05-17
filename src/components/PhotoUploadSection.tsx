import { useRef, useState } from "react";
import { Camera, Upload, AlertTriangle } from "lucide-react";

import { toast } from "sonner";
import { prepareImageForUpload } from "@/utils/resizeImage";
import PhotoCard, { PhotoEntry } from "./PhotoCard";

async function uploadFile(_: {
  data: any;
  filename: string;
}): Promise<{ fileUrl: string }> {
  return { fileUrl: "" };
}
async function savePhoto(_: Record<string, any>): Promise<void> {}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

type Props = {
  complaintId: string;
  complaintRecordId?: string;
  /** When provided, photos are directly linked to this inspection record (no date-window grouping needed) */
  inspectionRecordId?: string;
  inspector: string;
  photos: PhotoEntry[];
  onPhotosChange: (
    photos: PhotoEntry[] | ((prev: PhotoEntry[]) => PhotoEntry[]),
  ) => void;
};

export default function PhotoUploadSection({
  complaintId,
  complaintRecordId,
  inspectionRecordId,
  inspector,
  photos,
  onPhotosChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (imageFiles.length === 0) {
      toast.error("Please select image files only.");
      return;
    }

    const newEntries: PhotoEntry[] = imageFiles.map((file) => ({
      id: generateId(),
      localUrl: URL.createObjectURL(file),
      uploadedUrl: "",
      uploading: true,
      photoType: "General",
      violationLabel: "",
      caption: "",
      savedToDb: false,
    }));

    onPhotosChange([...photos, ...newEntries]);

    // Upload each file
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const entry = newEntries[i];
      try {
        const { data, filename } = await prepareImageForUpload(file);
        const { fileUrl } = await uploadFile({ data, filename });

        // Save to DB
        await savePhoto({
          photoUrl: fileUrl,
          photoType: "General",
          complaintId: complaintId || undefined,
          complaintRecordId: complaintRecordId || undefined,
          inspector: inspector || undefined,
          inspectionRecordId: inspectionRecordId || undefined,
        });

        onPhotosChange((prev) =>
          prev.map((p) =>
            p.id === entry.id
              ? {
                  ...p,
                  uploading: false,
                  uploadedUrl: fileUrl,
                  savedToDb: !!complaintId,
                }
              : p,
          ),
        );
      } catch {
        onPhotosChange((prev) =>
          prev.map((p) =>
            p.id === entry.id
              ? { ...p, uploading: false, error: "Upload failed" }
              : p,
          ),
        );
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const handleChange = (id: string, field: keyof PhotoEntry, value: string) => {
    onPhotosChange(
      photos.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const handleRemove = (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (photo?.localUrl) URL.revokeObjectURL(photo.localUrl);
    onPhotosChange(photos.filter((p) => p.id !== id));
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground text-lg">
            Inspection Photos
          </h2>
          <span className="bg-primary/10 text-primary text-sm font-semibold px-3 py-0.5 rounded-full ml-2">
            {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {!complaintId && (
          <div className="flex items-start gap-2 bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 text-sm text-warning">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Enter a <strong>Complaint ID</strong> above to save photos
              permanently to the database.
            </span>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            processFiles(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
        >
          <Upload className="w-8 h-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Drop photos here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, HEIC, WebP — files over 25MB auto-resized at 600 DPI
              quality
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => processFiles(e.target.files)}
          />
        </div>

        {/* Photo Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onChange={handleChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
