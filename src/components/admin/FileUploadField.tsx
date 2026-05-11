import { useState, useRef } from "react";
import { adminApi } from "@/lib/api";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (url: string) => void;
  password: string;
  accept?: string;
  label?: string;
  maxSizeMB?: number;
}

const FileUploadField = ({ value, onChange, password, accept = "image/*", label = "Subir", maxSizeMB = 50 }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Máximo ${maxSizeMB} MB`);
      return;
    }
    setUploading(true);
    try {
      const result = await adminApi.uploadFile(password, file);
      onChange(result.url);
      toast.success("Archivo subido");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const isVideo = value && (value.includes("/videos/") || value.match(/\.(mp4|webm|mov)$/i));

  return (
    <div className="space-y-2">
      {value && (
        <div className="w-24 h-16 rounded-lg overflow-hidden border border-border bg-muted">
          {isVideo ? (
            <video src={value} className="w-full h-full object-cover" muted />
          ) : (
            <img src={value} alt="preview" className="w-full h-full object-cover" />
          )}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL o sube archivo"
          className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 rounded-lg bg-accent text-accent-foreground font-body text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
        >
          {uploading ? <span className="animate-spin"></span> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? "..." : label}
        </button>
      </div>
      <input ref={fileRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
    </div>
  );
};

export default FileUploadField;
