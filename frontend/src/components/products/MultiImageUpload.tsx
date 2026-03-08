import { useState } from "react";
import { Upload, X } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { ConfirmDelete } from "@/components/ui/confirm-delete";

interface MultiImageUploadProps {
  value: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const MultiImageUpload = ({ value, onChange, maxImages = 5 }: MultiImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = maxImages - value.length;
    if (remaining <= 0) {
      toast("Image limit reached", { description: `Maximum ${maxImages} images allowed.` });
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        const result = await api.uploadImage(file);
        uploaded.push(result.url);
      }
      onChange([...value, ...uploaded]);
      toast("Images uploaded", { description: `${uploaded.length} image(s) added.` });
    } catch (error) {
      toast("Upload failed", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, idx) => idx !== index));
  };

  const remainingSlots = Math.max(maxImages - value.length, 0);

  return (
    <div className="space-y-3">
      <label
        className={`block rounded-2xl border border-dashed p-6 cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-secondary/50" : "border-border/70 bg-secondary/30 hover:bg-secondary/40"
        }`}
        onDragOver={event => {
          event.preventDefault();
          if (!isUploading && remainingSlots > 0) {
            setIsDragActive(true);
          }
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={event => {
          event.preventDefault();
          setIsDragActive(false);
          if (isUploading || remainingSlots === 0) return;
          handleFiles(event.dataTransfer.files);
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={event => handleFiles(event.target.files)}
          disabled={isUploading || remainingSlots === 0}
        />
        <div className="min-h-28 flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <Upload size={24} />
          <p className="text-sm font-medium text-foreground">
            {isUploading ? "Uploading photos..." : remainingSlots === 0 ? "Photo limit reached" : "Drop photos here or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG · {value.length}/{maxImages} uploaded
          </p>
        </div>
      </label>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {value.map((image, index) => (
            <div key={`${image}-${index}`} className="relative rounded-xl overflow-hidden border border-border/60 aspect-square">
              <img src={image} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
              <ConfirmDelete
                onConfirm={() => removeImage(index)}
                title="Remove this image?"
                description="This image will be removed from the product."
                confirmLabel="Remove"
              >
                <button
                  type="button"
                  className="absolute top-1 right-1 rounded-full bg-card/90 p-1 text-foreground hover:text-destructive"
                >
                  <X size={12} />
                </button>
              </ConfirmDelete>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;
