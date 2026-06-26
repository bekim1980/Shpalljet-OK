import { useState, useRef, useCallback } from "react";
import { Camera, X, GripVertical, ImagePlus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ImageUploaderProps {
  images: File[];
  previews: string[];
  maxImages?: number;
  onImagesChange: (images: File[], previews: string[]) => void;
}

const ImageUploader = ({ images, previews, maxImages = 5, onImagesChange }: ImageUploaderProps) => {
  const { t } = useTranslation();
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (files: File[]) => {
      const remaining = maxImages - images.length;
      const toAdd = files.slice(0, remaining);
      if (toAdd.length === 0) return;

      const newImages = [...images, ...toAdd];
      const newPreviews = [...previews, ...toAdd.map((f) => URL.createObjectURL(f))];
      onImagesChange(newImages, newPreviews);
    },
    [images, previews, maxImages, onImagesChange],
  );

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    onImagesChange(
      images.filter((_, i) => i !== index),
      previews.filter((_, i) => i !== index),
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files?.length) {
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      addFiles(files);
    }
  };

  const handleReorderDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const newImages = [...images];
    const newPreviews = [...previews];
    const [movedImg] = newImages.splice(dragIndex, 1);
    const [movedPrev] = newPreviews.splice(dragIndex, 1);
    newImages.splice(targetIndex, 0, movedImg);
    newPreviews.splice(targetIndex, 0, movedPrev);
    onImagesChange(newImages, newPreviews);
    setDragIndex(null);
  };

  return (
    <div className="space-y-2 min-w-0">
      <label className="text-sm font-medium leading-none">
        {t("sell.uploadLabel")} ({t("sell.uploadCount", { count: images.length, max: maxImages })})
      </label>

      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all min-w-0 ${
            dragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-secondary/30"
          }`}
        >
          <div className="mx-auto w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center mb-2">
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground px-1">{t("sell.uploadDrop")}</p>
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 mt-1 min-w-0">
          {previews.map((src, i) => (
            <div
              key={src}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleReorderDrop(i)}
              onDragEnd={() => setDragIndex(null)}
              className={`relative aspect-square rounded-lg overflow-hidden border border-border/60 bg-secondary/30 group transition-transform ${
                dragIndex === i ? "opacity-50 scale-95" : ""
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />

              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                  {t("sell.uploadCover")}
                </span>
              )}

              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                <GripVertical className="h-4 w-4 text-foreground/80 drop-shadow" />
              </div>

              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors bg-secondary/20"
            >
              <Camera className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{t("sell.uploadAdd")}</span>
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          addFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
};

export default ImageUploader;
