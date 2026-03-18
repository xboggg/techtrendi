/**
 * Client-side image optimization before upload.
 * Resizes large images and converts to WebP for smaller file sizes.
 */

interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg";
}

const DEFAULT_OPTIONS: OptimizeOptions = {
  maxWidth: 1200,
  maxHeight: 800,
  quality: 0.82,
  format: "webp",
};

export async function optimizeImage(
  file: File,
  options: OptimizeOptions = {}
): Promise<{ blob: Blob; fileName: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip optimization for SVGs and GIFs
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return { blob: file, fileName: file.name };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > opts.maxWidth! || height > opts.maxHeight!) {
        const ratioW = opts.maxWidth! / width;
        const ratioH = opts.maxHeight! / height;
        const ratio = Math.min(ratioW, ratioH);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = opts.format === "webp" ? "image/webp" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to optimize image"));
            return;
          }

          const ext = opts.format === "webp" ? "webp" : "jpg";
          const baseName = file.name.replace(/\.[^.]+$/, "");
          const fileName = `${Date.now()}-${baseName}.${ext}`;

          resolve({ blob, fileName });
        },
        mimeType,
        opts.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for optimization"));
    };

    img.src = url;
  });
}
