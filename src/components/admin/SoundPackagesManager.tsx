import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/api";
import { Trash2, Plus, Upload, Save, Image as ImageIcon, Video, GripVertical } from "lucide-react";
import { toast } from "sonner";
import FileUploadField from "./FileUploadField";

interface Props {
  password: string;
}

const SoundPackagesManager = ({ password }: Props) => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: packages } = useQuery({
    queryKey: ["sound-packages"],
    queryFn: async () => {
      const { data } = await supabase.from("sound_packages").select("*").order("sort_order");
      return data || [];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["sound-packages"] });

  const handleCreate = async () => {
    try {
      await adminApi.call(password, {
        action: "insert",
        table: "sound_packages",
        data: { name: "Nuevo Paquete", price: 0, features: [], sort_order: (packages?.length || 0) },
      });
      toast.success("Paquete creado");
      refresh();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este paquete y todo su contenido?")) return;
    try {
      await adminApi.call(password, { action: "delete", table: "sound_packages", id });
      toast.success("Eliminado");
      refresh();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-foreground text-xl">Paquetes de Sonido</h3>
        <button onClick={handleCreate} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm">
          <Plus className="w-4 h-4" /> Nuevo paquete
        </button>
      </div>

      {(packages || []).map((pkg: any) => (
        <PackageEditor
          key={pkg.id}
          pkg={pkg}
          password={password}
          isEditing={editingId === pkg.id}
          onToggleEdit={() => setEditingId(editingId === pkg.id ? null : pkg.id)}
          onDelete={() => handleDelete(pkg.id)}
          onRefresh={refresh}
        />
      ))}
    </div>
  );
};

const PackageEditor = ({
  pkg, password, isEditing, onToggleEdit, onDelete, onRefresh,
}: {
  pkg: any; password: string; isEditing: boolean;
  onToggleEdit: () => void; onDelete: () => void; onRefresh: () => void;
}) => {
  const [form, setForm] = useState({
    name: pkg.name,
    price: pkg.price,
    description: pkg.description || "",
    capacity: pkg.capacity || "",
    badge: pkg.badge || "",
    features: Array.isArray(pkg.features) ? pkg.features : [],
    visible: pkg.visible,
    image_url: pkg.image_url || "",
  });
  const [newFeature, setNewFeature] = useState("");
  const queryClient = useQueryClient();

  const { data: photos } = useQuery({
    queryKey: ["package-photos", pkg.id],
    queryFn: async () => {
      const { data } = await supabase.from("package_photos").select("*").eq("package_id", pkg.id).order("sort_order");
      return data || [];
    },
    enabled: isEditing,
  });

  const { data: videos } = useQuery({
    queryKey: ["package-videos", pkg.id],
    queryFn: async () => {
      const { data } = await supabase.from("package_videos").select("*").eq("package_id", pkg.id).order("sort_order");
      return data || [];
    },
    enabled: isEditing,
  });

  const handleSave = async () => {
    try {
      await adminApi.call(password, {
        action: "update",
        table: "sound_packages",
        id: pkg.id,
        data: { ...form, updated_at: new Date().toISOString() },
      });
      toast.success("Paquete guardado");
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setForm((prev) => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
    setNewFeature("");
  };

  const removeFeature = (idx: number) => {
    setForm((prev) => ({ ...prev, features: prev.features.filter((_: any, i: number) => i !== idx) }));
  };

  const refreshMedia = () => {
    queryClient.invalidateQueries({ queryKey: ["package-photos", pkg.id] });
    queryClient.invalidateQueries({ queryKey: ["package-videos", pkg.id] });
  };

  const handlePhotoUpload = async (url: string) => {
    try {
      await adminApi.call(password, {
        action: "insert",
        table: "package_photos",
        data: { package_id: pkg.id, image_url: url, sort_order: (photos?.length || 0) },
      });
      toast.success("Foto agregada");
      refreshMedia();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteMedia = async (table: string, id: string) => {
    if (!confirm("¿Eliminar?")) return;
    try {
      await adminApi.call(password, { action: "delete", table, id });
      toast.success("Eliminado");
      refreshMedia();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggleEdit}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <div>
            <span className="font-display font-bold text-foreground">{pkg.name}</span>
            <span className="text-sm text-muted-foreground font-body ml-3">
              {pkg.price === 0 ? "Incluido" : `+$${Number(pkg.price).toLocaleString()} MXN`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!pkg.visible && <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded font-body">Oculto</span>}
          <span className="text-xs text-muted-foreground font-body">{isEditing ? "▲" : "▼"}</span>
        </div>
      </button>

      {isEditing && (
        <div className="border-t border-border p-5 space-y-5">
          {/* Basic fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Nombre</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none" />
            </div>
            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Precio extra (MXN)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none" />
            </div>
            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Capacidad</label>
              <input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none" />
            </div>
            <div>
              <label className="text-sm font-body text-muted-foreground mb-1 block">Badge</label>
              <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none" />
            </div>
          </div>

          <div>
            <label className="text-sm font-body text-muted-foreground mb-1 block">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none resize-none" />
          </div>

          {/* Package cover image */}
          <div>
            <label className="text-sm font-body text-muted-foreground mb-1 block">Imagen principal del paquete (aparece en perfil del grupo)</label>
            <FileUploadField value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} password={password} label="Subir imagen" />
          </div>

          {/* Visible toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })}
              className="w-4 h-4 rounded border-border" />
            <span className="text-sm font-body text-foreground">Visible en el sitio</span>
          </label>

          {/* Features list */}
          <div>
            <label className="text-sm font-body text-muted-foreground mb-2 block">Lo que incluye</label>
            <div className="space-y-1.5 mb-2">
              {form.features.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                  <span className="flex-1 text-sm font-body text-foreground">{f}</span>
                  <button onClick={() => removeFeature(i)} className="text-destructive hover:opacity-80">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newFeature} onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                placeholder="Agregar característica..."
                className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none" />
              <button onClick={addFeature} className="px-3 py-2 rounded-lg bg-accent text-accent-foreground font-body text-xs font-semibold">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Photos */}
          <div>
            <h4 className="text-sm font-body font-semibold text-foreground mb-2 flex items-center gap-1">
              <ImageIcon className="w-4 h-4 text-gold" /> Fotos del paquete
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              {(photos || []).map((p: any) => (
                <div key={p.id} className="relative group rounded-lg overflow-hidden border border-border">
                  <img src={p.image_url} alt="" className="w-full aspect-video object-cover" />
                  <button onClick={() => handleDeleteMedia("package_photos", p.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <FileUploadField value="" onChange={handlePhotoUpload} password={password} label="Subir foto" />
          </div>

          {/* Videos */}
          <div>
            <h4 className="text-sm font-body font-semibold text-foreground mb-2 flex items-center gap-1">
              <Video className="w-4 h-4 text-gold" /> Videos del paquete
            </h4>
            <PackageVideoUploader packageId={pkg.id} videos={videos || []} password={password} onRefresh={refreshMedia} onDelete={handleDeleteMedia} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} className="inline-flex items-center gap-1 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm">
              <Save className="w-4 h-4" /> Guardar cambios
            </button>
            <button onClick={onDelete} className="inline-flex items-center gap-1 px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground font-body font-semibold text-sm">
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const PackageVideoUploader = ({
  packageId, videos, password, onRefresh, onDelete,
}: {
  packageId: string; videos: any[]; password: string; onRefresh: () => void; onDelete: (table: string, id: string) => void;
}) => {
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAddYoutube = async () => {
    if (!title || !youtubeUrl) { toast.error("Llena título y URL"); return; }
    try {
      await adminApi.call(password, {
        action: "insert", table: "package_videos",
        data: { package_id: packageId, title, youtube_url: youtubeUrl, sort_order: videos.length },
      });
      setTitle(""); setYoutubeUrl("");
      toast.success("Video agregado"); onRefresh();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUploadMp4 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { toast.error("Máximo 100 MB"); return; }
    setUploading(true);
    try {
      const result = await adminApi.uploadFile(password, file);
      await adminApi.call(password, {
        action: "insert", table: "package_videos",
        data: { package_id: packageId, title: file.name, video_url: result.url, sort_order: videos.length },
      });
      toast.success("Video subido"); onRefresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div className="space-y-3">
      {videos.map((v: any) => (
        <div key={v.id} className="flex gap-3 items-center bg-muted rounded-lg p-3 border border-border">
          {v.video_url ? (
            <video src={v.video_url} className="w-24 h-16 object-cover rounded" muted />
          ) : v.youtube_url ? (
            <img src={`https://img.youtube.com/vi/${extractYtId(v.youtube_url)}/mqdefault.jpg`} alt="" className="w-24 h-16 object-cover rounded" />
          ) : null}
          <div className="flex-1 min-w-0">
            <p className="font-body font-semibold text-sm text-foreground truncate">{v.title}</p>
            <p className="font-body text-xs text-muted-foreground truncate">{v.video_url ? "MP4" : v.youtube_url}</p>
          </div>
          <button onClick={() => onDelete("package_videos", v.id)} className="p-1.5 rounded-full bg-destructive text-destructive-foreground">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* YouTube */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título"
          className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none" />
        <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="URL de YouTube"
          className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none" />
        <button onClick={handleAddYoutube} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* MP4 upload */}
      <button onClick={() => fileRef.current?.click()} disabled={uploading}
        className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-body text-xs font-semibold disabled:opacity-50">
        {uploading ? "Subiendo..." : <><Upload className="w-3.5 h-3.5" /> Subir video MP4</>}
      </button>
      <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/mov" onChange={handleUploadMp4} className="hidden" />
    </div>
  );
};

function extractYtId(url: string) {
  const m = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] || "";
}

export default SoundPackagesManager;
