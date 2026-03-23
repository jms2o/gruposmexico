import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Music, MapPin, Star, Image as ImageIcon, Video, DollarSign, Clock } from "lucide-react";

function extractYtId(url: string) {
  const m = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] || "";
}

const ProfilePreview = ({ profileId }: { profileId: string }) => {
  const { data: profile } = useQuery({
    queryKey: ["preview-profile", profileId],
    queryFn: async () => {
      const { data } = await supabase.from("group_profiles").select("*").eq("id", profileId).maybeSingle();
      return data;
    },
  });

  const { data: allContent } = useQuery({
    queryKey: ["preview-all-content", profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from("content_submissions")
        .select("*")
        .eq("group_profile_id", profileId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: membership } = useQuery({
    queryKey: ["preview-membership", profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from("group_memberships")
        .select("*, membership_plans(name, tier, commission_rate)")
        .eq("group_profile_id", profileId)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
  });

  if (!profile) return <p className="text-muted-foreground font-body">Cargando perfil...</p>;

  const photos = (allContent || []).filter((c: any) => c.type === "photo") as any[];
  const videos = (allContent || []).filter((c: any) => c.type === "video") as any[];
  const pricePerHour = Number(profile.price_per_hour || 0);
  const minHours = Number(profile.min_hours || 3);
  const eventTotal = pricePerHour * minHours;

  // Use first photo as hero
  const heroPhoto = photos.find((p: any) => p.status === "approved")?.content?.url || photos[0]?.content?.url;

  return (
    <div className="space-y-6">
      {/* How the profile would look publicly */}
      <div className="bg-card border-2 border-gold/30 rounded-2xl overflow-hidden">
        <div className="bg-gold/10 px-4 py-2 text-center">
          <p className="font-body text-xs font-semibold text-gold">👁 Vista previa — Así se vería el perfil publicado</p>
        </div>

        {/* Hero */}
        <div className="h-56 bg-gradient-to-br from-foreground/10 to-foreground/5 relative">
          {heroPhoto && <img src={heroPhoto} alt="" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-gold text-gold" />
              ))}
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground">{profile.group_name}</h2>
            <div className="flex items-center gap-3 text-muted-foreground font-body text-sm mt-1">
              <span className="flex items-center gap-1"><Music className="w-3.5 h-3.5" /> {profile.group_type}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.city || "Mazatlán"}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Pricing info */}
          {pricePerHour > 0 && (
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gold" />
                <span className="font-body text-sm"><span className="font-bold text-foreground">${pricePerHour.toLocaleString()}</span> <span className="text-muted-foreground">/hora</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-body text-sm text-muted-foreground">Mín. {minHours} hrs</span>
              </div>
              <div className="font-body text-sm">
                <span className="font-bold text-foreground">Total desde: ${eventTotal.toLocaleString()} MXN</span>
              </div>
            </div>
          )}

          {/* Membership */}
          {membership && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-lg bg-gold/20 text-gold font-body text-xs font-bold">
                {(membership as any)?.membership_plans?.name || "Plan"}
              </span>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="font-display font-bold text-foreground mb-2">Descripción</h3>
            <p className="font-body text-sm text-muted-foreground">{profile.description || "Sin descripción"}</p>
          </div>

          {/* Contact */}
          {(profile.phone || profile.whatsapp) && (
            <div>
              <h3 className="font-display font-bold text-foreground mb-2">Contacto</h3>
              <p className="font-body text-sm text-muted-foreground">
                {profile.phone && <>Tel: {profile.phone}</>}
                {profile.whatsapp && <> · WhatsApp: {profile.whatsapp}</>}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gold" /> Fotos ({photos.length})
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((p: any) => (
              <div key={p.id} className="relative rounded-xl overflow-hidden aspect-square">
                <img src={p.content?.url} alt="" className="w-full h-full object-cover" />
                <span className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${p.status === "approved" ? "bg-primary/90 text-primary-foreground" : p.status === "rejected" ? "bg-destructive/90 text-destructive-foreground" : "bg-gold/90 text-accent-foreground"}`}>
                  {p.status === "approved" ? "✓" : p.status === "rejected" ? "✗" : "⏳"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <Video className="w-5 h-5 text-gold" /> Videos ({videos.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((v: any) => {
              const url = v.content?.url || "";
              const ytId = extractYtId(url);
              return (
                <div key={v.id} className="rounded-xl overflow-hidden bg-muted aspect-video relative">
                  {ytId ? (
                    <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full" allowFullScreen />
                  ) : (
                    <video src={url} controls className="w-full h-full object-cover" />
                  )}
                  <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${v.status === "approved" ? "bg-primary/90 text-primary-foreground" : v.status === "rejected" ? "bg-destructive/90 text-destructive-foreground" : "bg-gold/90 text-accent-foreground"}`}>
                    {v.status === "approved" ? "✓" : v.status === "rejected" ? "✗" : "⏳"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {photos.length === 0 && videos.length === 0 && (
        <p className="text-center text-muted-foreground font-body text-sm py-8">Este perfil aún no tiene contenido multimedia.</p>
      )}
    </div>
  );
};

export default ProfilePreview;
