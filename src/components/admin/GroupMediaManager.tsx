import { useState, useRef } from "react";
import { adminApi } from "@/lib/api";
import { useAllGroups, useGroupMedia } from "@/hooks/useData";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Upload, Image as ImageIcon, Video, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  password: string;
}

function extractYtId(url: string) {
  const m = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] || "";
}

const GroupMediaManager = ({ password }: Props) => {
  const { data: groups } = useAllGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const queryClient = useQueryClient();

  // Find the group_profile_id for the selected musical_group
  const selectedGroup = groups?.find((g) => g.id === selectedGroupId);
  const groupProfileId = selectedGroup?.group_profile_id || undefined;

  // Read from centralized group_media table
  const { data: media } = useGroupMedia(groupProfileId);

  const photos = (media || []).filter((m: any) => m.type === "photo");
  const videos = (media || []).filter((m: any) => m.type === "video" || m.type === "youtube");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["group-media", groupProfileId] });

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;
    try {
      await adminApi.call(password, { action: "delete", table: "group_media", id });
      toast.success("Eliminado");
      refresh();
    } catch (err: any) { toast.error(err.message); }
  };

  if (!groups?.length) return <p className="text-muted-foreground font-body">No hay grupos creados.</p>;

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-body text-muted-foreground mb-1 block">Selecciona un grupo</label>
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="w-full max-w-md px-4 py-3 rounded-lg bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="">-- Elegir grupo --</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {selectedGroupId && !groupProfileId && (
        <p className="text-sm text-destructive font-body">Este grupo no tiene un perfil vinculado (group_profile_id). Vincúlalo primero.</p>
      )}

      {groupProfileId && (
        <>
          <PhotoSection groupProfileId={groupProfileId} photos={photos} password={password} onRefresh={refresh} onDelete={handleDelete} />
          <VideoSection groupProfileId={groupProfileId} videos={videos} password={password} onRefresh={refresh} onDelete={handleDelete} />
        </>
      )}
    </div>
  );
};

// Photos sub-section
const PhotoSection = ({
  groupProfileId, photos, password, onRefresh, onDelete,
}: {
  groupProfileId: string; photos: any[]; password: string; onRefresh: () => void; onDelete: (id: string) => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name}: Máximo 10 MB`); continue; }
        const url = await adminApi.uploadImage(password, file);
        await adminApi.call(password, {
          action: "insert", table: "group_media",
          data: { group_profile_id: groupProfileId, type: "photo", url, title: file.name, uploaded_by: "admin" },
        });
      }
      toast.success("Fotos agregadas");
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-gold" /> Fotos del grupo
        </h3>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-whatsapp-hover transition-colors disabled:opacity-50">
          {uploading ? "Subiendo..." : <><Upload className="w-4 h-4" /> Subir fotos</>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
      </div>
      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">Sin fotos. Sube la primera.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative group rounded-lg overflow-hidden border border-border">
              <img src={p.url} alt="" className="w-full aspect-video object-cover" />
              <button onClick={() => onDelete(p.id)}
                className="absolute top-1 right-1 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Videos sub-section - supports YouTube + MP4 upload
const VideoSection = ({
  groupProfileId, videos, password, onRefresh, onDelete,
}: {
  groupProfileId: string; videos: any[]; password: string; onRefresh: () => void; onDelete: (id: string) => void;
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAddYoutube = async () => {
    const url = youtubeUrl.trim();
    if (!url) { toast.error("Ingresa una URL de YouTube"); return; }
    const ytId = extractYtId(url);
    const thumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
    try {
      await adminApi.call(password, {
        action: "insert", table: "group_media",
        data: { group_profile_id: groupProfileId, type: "youtube", url, thumbnail, title: "YouTube Video", uploaded_by: "admin" },
      });
      setYoutubeUrl("");
      toast.success("Video de YouTube agregado"); onRefresh();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUploadMp4 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 100 * 1024 * 1024) { toast.error(`${file.name}: Máximo 100 MB`); continue; }
        const result = await adminApi.uploadFile(password, file);
        await adminApi.call(password, {
          action: "insert", table: "group_media",
          data: { group_profile_id: groupProfileId, type: "video", url: result.url, title: file.name, uploaded_by: "admin" },
        });
      }
      toast.success("Videos subidos"); onRefresh();
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-4">
        <Video className="w-5 h-5 text-gold" /> Videos del grupo
      </h3>

      {/* YouTube add form */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg bg-muted border border-border">
          <LinkIcon className="w-4 h-4 text-primary flex-shrink-0" />
          <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="URL de YouTube"
            className="flex-1 bg-transparent text-foreground font-body text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        <button onClick={handleAddYoutube} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm">
          <Plus className="w-4 h-4" /> YouTube
        </button>
      </div>

      {/* MP4 upload button */}
      <div className="mb-4">
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-body text-xs font-semibold disabled:opacity-50">
          {uploading ? "Subiendo..." : <><Upload className="w-3.5 h-3.5" /> Subir video MP4</>}
        </button>
        <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/mov" multiple onChange={handleUploadMp4} className="hidden" />
      </div>

      {videos.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">Sin videos. Agrega el primero.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {videos.map((v) => {
            const ytId = v.type === "youtube" ? extractYtId(v.url) : "";
            const isMp4 = v.type === "video";
            return (
              <div key={v.id} className="flex gap-3 items-center bg-muted rounded-lg p-3 border border-border">
                {isMp4 ? (
                  <video src={v.url} className="w-24 h-16 object-cover rounded" muted />
                ) : ytId ? (
                  <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={v.title} className="w-24 h-16 object-cover rounded" />
                ) : null}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-body font-semibold text-sm text-foreground truncate">{v.title || "Video"}</p>
                  <p className="font-body text-xs text-muted-foreground truncate">
                    {v.type === "youtube" ? "▶️ YouTube" : "📹 Video MP4"} · {v.uploaded_by === "admin" ? "Admin" : "Grupo"}
                  </p>
                </div>
                <button onClick={() => onDelete(v.id)} className="p-1.5 rounded-full bg-destructive text-destructive-foreground hover:opacity-80">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupMediaManager;
