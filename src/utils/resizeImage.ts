const MAX_BYTES = 24 * 1024 * 1024; // 24MB — stay safely under the 25MB limit
const MAX_DIMENSION = 4000; // ~600 DPI for a 6" print
const WEBP_QUALITY = 0.92;

/**
 * If file is under 25MB, returns it unchanged.
 * Otherwise resizes to MAX_DIMENSION and converts to WebP at 0.92 quality.
 */
export async function prepareImageForUpload(
  file: File,
): Promise<{ data: Blob; filename: string }> {
  if (file.size <= MAX_BYTES) {
    return { data: file, filename: file.name };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { width, height } = img;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Failed to convert image"));
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          resolve({ data: blob, filename: `${baseName}.webp` });
        },
        "image/webp",
        WEBP_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}
