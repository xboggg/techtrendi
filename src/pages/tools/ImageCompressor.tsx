import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Upload, Download, Image, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ImageFile {
  file: File;
  preview: string;
  original: { size: number; width: number; height: number };
  compressed?: { size: number; dataUrl: string };
}

export default function ImageCompressor() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [quality, setQuality] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => file.type.startsWith("image/"));

    if (validFiles.length !== files.length) {
      toast.error("Some files were skipped. Only images are allowed.");
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const newImage: ImageFile = {
            file,
            preview: event.target?.result as string,
            original: {
              size: file.size,
              width: img.width,
              height: img.height,
            },
          };
          setImages((prev) => [...prev, newImage]);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const compressImage = async (imageFile: ImageFile): Promise<ImageFile> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageFile);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality / 100);
        
        // Calculate compressed size from base64
        const base64Length = compressedDataUrl.length - "data:image/jpeg;base64,".length;
        const compressedSize = Math.round((base64Length * 3) / 4);

        resolve({
          ...imageFile,
          compressed: {
            size: compressedSize,
            dataUrl: compressedDataUrl,
          },
        });
      };
      img.src = imageFile.preview;
    });
  };

  const handleCompress = async () => {
    if (images.length === 0) {
      toast.error("Please add images first");
      return;
    }

    setIsProcessing(true);
    
    const compressedImages = await Promise.all(images.map(compressImage));
    setImages(compressedImages);
    
    setIsProcessing(false);
    toast.success(`${images.length} image(s) compressed!`);
  };

  const downloadImage = (image: ImageFile) => {
    if (!image.compressed) return;

    const link = document.createElement("a");
    link.href = image.compressed.dataUrl;
    link.download = `compressed_${image.file.name.replace(/\.[^/.]+$/, "")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getSavingsPercent = (original: number, compressed: number) => {
    return Math.round(((original - compressed) / original) * 100);
  };

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <Image className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Image Compressor
            </h1>
            <p className="text-muted-foreground text-lg">
              Compress images without losing quality. Reduce file sizes for faster loading.
            </p>
          </div>

          {/* Upload Area */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8 mb-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium mb-1">Click to upload images</p>
              <p className="text-sm text-muted-foreground">PNG, JPG, WebP up to 10MB each</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Quality Slider */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">
                  Compression Quality
                </label>
                <span className="text-sm font-bold text-primary">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Smaller file</span>
                <span>Higher quality</span>
              </div>
            </div>

            {/* Compress Button */}
            {images.length > 0 && (
              <Button
                variant="hero"
                size="xl"
                onClick={handleCompress}
                disabled={isProcessing}
                className="w-full mt-6"
              >
                {isProcessing ? "Compressing..." : `Compress ${images.length} Image(s)`}
              </Button>
            )}
          </div>

          {/* Image List */}
          {images.length > 0 && (
            <div className="space-y-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
                >
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate">{image.file.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{image.original.width}x{image.original.height}</span>
                      <span>Original: {formatSize(image.original.size)}</span>
                      {image.compressed && (
                        <>
                          <span className="text-primary">
                            → {formatSize(image.compressed.size)}
                          </span>
                          <span className="text-primary font-medium">
                            -{getSavingsPercent(image.original.size, image.compressed.size)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {image.compressed && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => downloadImage(image)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImage(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tips Section */}
          <div className="mt-10 p-6 rounded-2xl bg-muted/50">
            <h3 className="font-semibold text-foreground mb-4">Compression Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                80% quality usually provides the best balance
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Use WebP format for even smaller file sizes
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Compressed images are perfect for websites and social media
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                All processing happens in your browser - files never leave your device
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
