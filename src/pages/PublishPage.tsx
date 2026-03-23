import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Video, Image, Plus, Loader2, Scissors } from "lucide-react";
import { useAuth, useGroupProfile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Progress } from "@/components/ui/progress";

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const PublishPage = () => {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useGroupProfile(user?.id);
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [activeTab, setActiveTab] = useState<"video" | "photo">("video");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [clipStart, setClipStart] = useState<number>(0);
  const [clipEnd, setClipEnd] = useState<number>(0);
  const [ytDuration, setYtDuration] = useState<number>(0);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleYtUrlChange = useCallback((url: string) => {
    setVideoUrl(url);
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (match?.[1]) {
      setShowTrimmer(true);
      if (ytDuration === 0) setYtDuration(300);
      if (clipEnd === 0) setClipEnd(60);
    } else {
      setShowTrimmer(false);
    }
  }, [ytDuration, clipEnd]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => { window.scrollTo(0, 0); }, []);

  if (loading || profileLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center pt-20 pb-24">
          <div className="animate-pulse text-muted-foreground font-body">Cargando...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 pt-20 pb-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-2">
            <Upload className="w-10 h-10 text-gold/50" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">Publica tu contenido</h2>
          <p className="text-muted-foreground font-body text-sm max-w-sm">
            Inicia sesión y registra tu grupo para subir videos y fotos.
          </p>
          <button onClick={() => navigate("/auth")} className="btn-gold px-6 py-3 text-sm mt-2">
            Iniciar sesión
          </button>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 pt-20 pb-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-2">
            <Upload className="w-10 h-10 text-gold/50" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">Registra tu grupo primero</h2>
          <p className="text-muted-foreground font-body text-sm max-w-sm">
            Necesitas un perfil de grupo para subir contenido.
          </p>
          <button onClick={() => navigate("/registrar-grupo")} className="btn-gold px-6 py-3 text-sm mt-2">
            Registrar mi grupo
          </button>
        </div>
      </>
    );
  }

  // Detect YouTube ID
  const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  const detectedYtId = ytMatch?.[1] || "";

  const handleUploadYoutube = async () => {
    if (!videoUrl.trim()) { toast.error("Ingresa un enlace de YouTube"); return; }
    if (!detectedYtId) { toast.error("Enlace de YouTube no válido"); return; }
    const thumbnail = `https://img.youtube.com/vi/${detectedYtId}/mqdefault.jpg`;

    setUploading(true);
    setUploadError(null);

    const insertData: any = {
      group_profile_id: profile.id,
      type: "youtube",
      url: videoUrl.trim(),
      thumbnail,
      title: title.trim() || "Video en vivo",
      uploaded_by: "group",
    };

    // Add clip times if user set them
    if (clipStart > 0) insertData.clip_start = clipStart;
    if (clipEnd > 0 && clipEnd > clipStart) insertData.clip_end = clipEnd;

    const { error } = await supabase.from("group_media").insert(insertData);

    setUploading(false);
    if (error) {
      const errMsg = `Error DB: ${error.code} — ${error.message}`;
      setUploadError(errMsg);
      toast.error(errMsg);
      return;
    }
    toast.success("¡Video publicado exitosamente!");
    setVideoUrl("");
    setTitle("");
    setClipStart(0);
    setClipEnd(0);
    setShowTrimmer(false);
    setUploadError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) { toast.error("Solo se aceptan videos e imágenes"); return; }

    if (file.size > MAX_FILE_SIZE) {
      const errMsg = `413 Payload Too Large: El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. Máximo ${MAX_FILE_SIZE_MB} MB.`;
      setUploadError(errMsg);
      toast.error(errMsg);
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
    const bucketName = isVideo ? "videos" : "images";
    const path = `group-uploads/${profile.id}/${Date.now()}.${ext}`;

    setUploadProgress(30);

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      const errMsg = `Storage Error: ${uploadError.message}`;
      setUploadError(errMsg);
      toast.error(errMsg);
      setUploading(false);
      setUploadProgress(0);
      return;
    }

    setUploadProgress(70);

    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(path);

    const { error: dbError } = await supabase.from("group_media").insert({
      group_profile_id: profile.id,
      type: isVideo ? "video" : "photo",
      url: publicUrl,
      title: title.trim() || (isVideo ? "Video" : "Foto"),
      uploaded_by: "group",
    });

    setUploadProgress(100);

    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      if (dbError) {
        const errMsg = `DB Error: ${dbError.code} — ${dbError.message}`;
        setUploadError(errMsg);
        toast.error(errMsg);
        return;
      }
      toast.success(isVideo ? "¡Video publicado!" : "¡Foto publicada!");
      setTitle("");
      setUploadError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 500);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20 pb-24 px-4">
        <div className="container max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">Publicar contenido</h1>
              <p className="text-muted-foreground font-body text-xs">Sube videos y fotos de tu grupo</p>
            </div>
          </div>

          {/* Tab selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("video")}
              className={`flex-1 py-3 rounded-xl font-body font-semibold text-sm transition-all ${
                activeTab === "video"
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "bg-card border border-border text-muted-foreground"
              }`}
            >
              <Video className="w-4 h-4 inline mr-1.5" /> Video
            </button>
            <button
              onClick={() => setActiveTab("photo")}
              className={`flex-1 py-3 rounded-xl font-body font-semibold text-sm transition-all ${
                activeTab === "photo"
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "bg-card border border-border text-muted-foreground"
              }`}
            >
              <Image className="w-4 h-4 inline mr-1.5" /> Foto
            </button>
          </div>

          {/* Title input */}
          <div className="mb-4">
            <label className="block text-sm font-body font-semibold text-foreground mb-2">Título (opcional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Boda en Mazatlán 2024"
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-gold/50 focus:outline-none transition-colors"
            />
          </div>

          {activeTab === "video" && (
            <>
              {/* YouTube URL */}
              <div className="mb-4">
                <label className="block text-sm font-body font-semibold text-foreground mb-2">Enlace de YouTube</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => handleYtUrlChange(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-gold/50 focus:outline-none transition-colors"
                />

                {/* YouTube preview + Trim UI */}
                {detectedYtId && (
                  <div className="mt-3 space-y-3">
                    {/* Preview thumbnail */}
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
                      <img
                        src={`https://img.youtube.com/vi/${detectedYtId}/hqdefault.jpg`}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Video className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Trim controls */}
                    <div className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Scissors className="w-4 h-4 text-gold" />
                        <span className="font-body font-semibold text-sm text-foreground">Recortar clip</span>
                        <span className="text-muted-foreground font-body text-xs ml-auto">
                          {formatTime(clipEnd - clipStart)} de duración
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-body text-muted-foreground">Inicio</label>
                            <span className="text-xs font-body font-semibold text-foreground">{formatTime(clipStart)}</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={Math.max(clipEnd - 5, 0)}
                            value={clipStart}
                            onChange={(e) => setClipStart(Number(e.target.value))}
                            className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-gold"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-body text-muted-foreground">Fin</label>
                            <span className="text-xs font-body font-semibold text-foreground">{formatTime(clipEnd)}</span>
                          </div>
                          <input
                            type="range"
                            min={clipStart + 5}
                            max={ytDuration}
                            value={clipEnd}
                            onChange={(e) => setClipEnd(Number(e.target.value))}
                            className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-gold"
                          />
                        </div>

                        <p className="text-[11px] font-body text-muted-foreground">
                          💡 Elige la mejor parte de tu video. Los clips cortos (30-60s) funcionan mejor en Reels.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUploadYoutube}
                  disabled={uploading}
                  className="w-full btn-gold py-3 text-sm mt-3 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploading ? "Publicando..." : "Publicar video de YouTube"}
                </button>
              </div>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted-foreground font-body text-xs">o sube un archivo</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          {/* File upload */}
          <label className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-gold/40 transition-colors bg-card/50">
            {uploading ? (
              <Loader2 className="w-10 h-10 text-gold animate-spin mb-3" />
            ) : (
              <Upload className="w-10 h-10 text-muted-foreground mb-3" />
            )}
            <span className="font-body font-semibold text-sm text-foreground">
              {uploading ? "Subiendo archivo..." : activeTab === "video" ? "Subir video MP4" : "Subir foto"}
            </span>
            <span className="font-body text-xs text-muted-foreground mt-1">
              {activeTab === "video" ? `Máx. ${MAX_FILE_SIZE_MB} MB · MP4, MOV` : "JPG, PNG, WEBP"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept={activeTab === "video" ? "video/mp4,video/quicktime,video/*" : "image/*"}
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>

          {uploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="h-2 bg-muted" />
              <p className="text-muted-foreground font-body text-sm mt-2 text-center">
                {uploadProgress < 100 ? `Subiendo... ${uploadProgress}%` : "¡Listo!"}
              </p>
            </div>
          )}

          {/* Error display */}
          {uploadError && (
            <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <p className="text-destructive font-body text-xs font-mono break-all">{uploadError}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PublishPage;
