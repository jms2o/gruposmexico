import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, MapPin, Music, Save, LogOut, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ESTADOS_CIUDADES } from "@/lib/locationData";

interface Props {
  profile: any;
  mainPhotoUrl: string | null;
  onSignOut: () => void;
  onRefetch: () => void;
}

const DashboardHeader = ({ profile, mainPhotoUrl, onSignOut, onRefetch }: Props) => {
  const [name, setName] = useState(profile.group_name);
  const [state, setState] = useState(profile.state || "Sinaloa");
  const [city, setCity] = useState(profile.city || "Mazatlán");
  const [genre, setGenre] = useState(profile.group_type || "Versátil");

  const ciudades = ESTADOS_CIUDADES[state] || [];

  useEffect(() => {
    if (ciudades.length > 0 && !ciudades.includes(city)) {
      setCity(ciudades[0]);
    }
  }, [state]);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLInputElement>(null);

  const coverUrl = (() => {
    const photos = profile.photos;
    if (Array.isArray(photos) && photos.length > 1) return photos[1];
    if (Array.isArray(photos) && photos.length > 0) return photos[0];
    return mainPhotoUrl;
  })();

  const handleUpload = async (file: File, type: "cover" | "profile") => {
    const setter = type === "cover" ? setUploadingCover : setUploadingProfile;
    setter(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `group-uploads/${profile.id}/${type}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("images").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);

      if (type === "profile") {
        const currentPhotos = Array.isArray(profile.photos) ? [...profile.photos] : [];
        currentPhotos[0] = urlData.publicUrl;
        await supabase.from("group_profiles").update({ photos: currentPhotos }).eq("id", profile.id);
        // Also sync profile photo to musical_groups public entry
        const { data: existing } = await supabase.from("musical_groups").select("id").eq("group_profile_id", profile.id).maybeSingle();
        if (existing) {
          await supabase.from("musical_groups").update({ image_url: urlData.publicUrl }).eq("id", existing.id);
        }
      } else {
        const currentPhotos = Array.isArray(profile.photos) ? [...profile.photos] : [];
        if (currentPhotos.length < 2) currentPhotos.push(urlData.publicUrl);
        else currentPhotos[1] = urlData.publicUrl;
        await supabase.from("group_profiles").update({ photos: currentPhotos }).eq("id", profile.id);
      }
      toast.success(type === "cover" ? "Portada actualizada" : "Foto de perfil actualizada");
      onRefetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setter(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("group_profiles").update({
        group_name: name,
        state,
        city,
        group_type: genre,
      }).eq("id", profile.id);
      if (error) throw error;

      // Sync to musical_groups so public page updates automatically
      const mainPhoto = Array.isArray(profile.photos) && profile.photos.length > 0 ? (profile.photos as any[])[0] : null;
      const { data: existing } = await supabase.from("musical_groups").select("id").eq("group_profile_id", profile.id).maybeSingle();
      if (existing) {
        await supabase.from("musical_groups").update({
          name,
          image_url: mainPhoto,
          state,
          city,
        }).eq("id", existing.id);
      }

      toast.success("Información guardada");
      onRefetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      {/* Cover photo */}
      <div className="relative h-56 md:h-72 bg-muted rounded-b-3xl overflow-hidden group">
        {coverUrl && <img src={coverUrl} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        <button
          onClick={() => coverRef.current?.click()}
          disabled={uploadingCover}
          className="absolute top-4 right-4 px-3 py-2 rounded-xl bg-card/80 backdrop-blur-sm text-foreground font-body text-xs font-semibold flex items-center gap-1.5 hover:bg-card transition-colors opacity-0 group-hover:opacity-100"
        >
          <Camera className="w-3.5 h-3.5" />
          {uploadingCover ? "Subiendo..." : "Texto Editable"}
        </button>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "cover")} />
      </div>

      {/* Profile photo */}
      <div className="absolute left-6 -bottom-12 z-10">
        <div className="relative group">
          <div className="w-24 h-24 rounded-2xl border-4 border-card bg-muted overflow-hidden shadow-lg">
            {mainPhotoUrl ? (
              <img src={mainPhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <Music className="w-8 h-8 text-primary" />
              </div>
            )}
          </div>
          <button
            onClick={() => profileRef.current?.click()}
            disabled={uploadingProfile}
            className="absolute inset-0 flex items-center justify-center rounded-2xl bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera className="w-5 h-5 text-primary-foreground" />
          </button>
          <input ref={profileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "profile")} />
        </div>
      </div>

      {/* Sign out */}
      <button onClick={onSignOut} className="absolute top-4 left-4 p-2 rounded-xl bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors">
        <LogOut className="w-4 h-4" />
      </button>

      {/* Info section */}
      <div className="pt-16 px-4 md:px-6 pb-4 md:pb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2 md:space-y-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xl md:text-2xl font-display font-bold text-foreground bg-transparent border-b-2 border-dashed border-border focus:border-primary outline-none pb-1 w-full max-w-md min-w-0"
                placeholder="Nombre del Grupo"
              />
              <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-body text-xs whitespace-nowrap">Editable</span>
            </div>
            <div className="flex items-center gap-1 text-gold font-body text-sm">
               <span className="text-muted-foreground ml-1">(# eventos)</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Music className="w-4 h-4 text-muted-foreground" />
                <input
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="font-body text-sm text-foreground bg-transparent border-b border-dashed border-border focus:border-primary outline-none w-24 md:w-28"
                  placeholder="Género"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="font-body text-sm text-foreground bg-transparent border-b border-dashed border-border focus:border-primary outline-none w-28 md:w-32"
                >
                  {Object.keys(ESTADOS_CIUDADES).map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="font-body text-sm text-foreground bg-transparent border-b border-dashed border-border focus:border-primary outline-none w-28 md:w-32"
                >
                  {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-whatsapp px-6 py-3 text-sm flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
