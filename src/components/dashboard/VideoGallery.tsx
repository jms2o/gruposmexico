import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Video, Plus, Play, Trash2, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  profile: any;
}

function extractYtId(url: string) {
  const m = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] || "";
}

const VideoGallery = ({ profile }: Props) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: media = [] } = useQuery({
    queryKey: ["group-media", profile.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("group_media")
        .select("*")
        .eq("group_profile_id", profile.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profile.id,
  });

  const photos = media.filter((m: any) => m.type === "photo");
  const videos = media.filter((m: any) => m.type === "video" || m.type === "youtube");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["group-media", profile.id] });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `group-uploads/${profile.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("images").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
      await supabase.from("group_media").insert({
        group_profile_id: profile.id,
        type: "photo",
        url: urlData.publicUrl,
        title: file.name,
        uploaded_by: "group",
      });
      toast.success("Foto subida");
      invalidate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { toast.error("Máximo 100 MB"); return; }
    setUploadingVideo(true);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `group-uploads/${profile.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("videos").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("videos").getPublicUrl(path);
      await supabase.from("group_media").insert({
        group_profile_id: profile.id,
        type: "video",
        url: urlData.publicUrl,
        title: file.name,
        uploaded_by: "group",
      });
      toast.success("Video subido");
      invalidate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleYoutubeAdd = async () => {
    const url = youtubeUrl.trim();
    if (!url) { toast.error("Ingresa una URL de YouTube"); return; }
    const ytId = extractYtId(url);
    const thumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
    await supabase.from("group_media").insert({
      group_profile_id: profile.id,
      type: "youtube",
      url,
      thumbnail,
      title: "YouTube Video",
      uploaded_by: "group",
    });
    toast.success("Video de YouTube agregado");
    setYoutubeUrl("");
    invalidate();
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm("¿Eliminar este archivo?")) return;
    const { error } = await supabase.from("group_media").delete().eq("id", mediaId);
    if (error) { toast.error(error.message); return; }
    toast.success("Eliminado");
    invalidate();
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-display font-bold text-foreground mb-4">Galería Multimedia</h2>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-6">
        <div className="flex gap-2">
          <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-foreground font-body text-sm font-semibold hover:bg-muted/80 transition-colors border border-border">
            <ImageIcon className="w-4 h-4" />
            {uploadingPhoto ? "Subiendo..." : "Foto"}
          </button>
          <button onClick={() => videoRef.current?.click()} disabled={uploadingVideo}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-foreground font-body text-sm font-semibold hover:bg-muted/80 transition-colors border border-border">
            <Video className="w-4 h-4" />
            {uploadingVideo ? "Subiendo..." : "Video"}
          </button>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-muted border border-border min-w-0">
            <LinkIcon className="w-4 h-4 text-primary flex-shrink-0" />
            <input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Link de YouTube"
              className="flex-1 bg-transparent text-foreground font-body text-sm outline-none placeholder:text-muted-foreground min-w-0"
            />
          </div>
          <button onClick={handleYoutubeAdd}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-body text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap">
            Agregar
          </button>
        </div>
      </div>

      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
      <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />

      {/* Video grid */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {videos.map((m: any) => {
            const ytId = m.type === "youtube" ? extractYtId(m.url) : "";
            return (
              <div key={m.id} className="relative group rounded-xl overflow-hidden bg-muted aspect-video">
                {ytId ? (
                  <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={m.url} className="w-full h-full object-cover" muted />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-foreground/60 flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                  </div>
                </div>
                <button onClick={() => handleDelete(m.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-destructive text-destructive-foreground">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/70 to-transparent p-3">
                  <p className="font-body text-xs text-primary-foreground font-semibold truncate">{m.title || "Video"}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo gallery */}
      {photos.length > 0 && (
        <>
          <h3 className="text-lg font-display font-bold text-foreground mt-6 mb-3">Fotos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((m: any) => (
              <div key={m.id} className="relative rounded-xl overflow-hidden aspect-square bg-muted group">
                <img src={m.url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => handleDelete(m.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-destructive text-destructive-foreground">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {videos.length === 0 && photos.length === 0 && (
        <p className="text-center text-muted-foreground font-body text-sm py-8">
          Aún no has subido contenido. ¡Sube tu primer foto o video!
        </p>
      )}

      <div className="text-center mt-4">
        <button onClick={() => videoRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 text-muted-foreground font-body text-sm hover:text-foreground transition-colors">
          <Plus className="w-4 h-4" /> Agregar más +
        </button>
      </div>
    </div>
  );
};

export default VideoGallery;
