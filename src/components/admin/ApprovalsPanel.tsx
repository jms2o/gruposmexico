import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/api";
import { FileCheck, Image as ImageIcon, Video, Link as LinkIcon, Eye, UserCheck, UserX, DollarSign, FileText, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ProfilePreview from "./ProfilePreview";

function extractYtId(url: string) {
  const m = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] || "";
}

type TabKey = "all" | "profiles" | "photos" | "videos" | "youtube" | "pricing" | "info";

const ApprovalsPanel = ({ password }: { password: string }) => {
  const [tab, setTab] = useState<TabKey>("all");
  const [previewProfileId, setPreviewProfileId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Pending profiles
  const { data: pendingProfiles, refetch: refetchProfiles } = useQuery({
    queryKey: ["admin-pending-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("group_profiles")
        .select("*, group_memberships(*, membership_plans(name, tier))")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // ALL content submissions
  const { data: submissions, refetch: refetchSubmissions } = useQuery({
    queryKey: ["admin-all-submissions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("content_submissions")
        .select("*, group_profiles(group_name, group_type, city, price_per_hour, min_hours, description)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const invalidateAll = () => {
    refetchProfiles();
    refetchSubmissions();
    queryClient.invalidateQueries({ queryKey: ["admin-group-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-pending-submissions"] });
    queryClient.invalidateQueries({ queryKey: ["all-groups"] });
    queryClient.invalidateQueries({ queryKey: ["all-active-groups"] });
    queryClient.invalidateQueries({ queryKey: ["featured-groups"] });
    queryClient.invalidateQueries({ queryKey: ["category-groups"] });
  };

  // Helper: find or create musical_groups entry for a profile
  const syncMusicalGroup = async (profileId: string) => {
    // Fetch full profile data
    const { data: profile } = await supabase.from("group_profiles").select("*").eq("id", profileId).maybeSingle();
    if (!profile) throw new Error("Perfil no encontrado");

    // Get categories
    const { data: categories } = await supabase.from("categories").select("id, title").eq("visible", true);
    
    // Exact match on category title
    const matchedCategory = categories?.find((c) => 
      c.title.toLowerCase().trim() === profile.group_type.toLowerCase().trim()
    );

    // Get best photo URL
    let photoUrl: string | null = null;
    
    // 1. Check for approved main_photo submission
    const { data: mainPhotos } = await supabase
      .from("content_submissions")
      .select("content")
      .eq("group_profile_id", profileId)
      .eq("type", "main_photo")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1);
    if (mainPhotos?.[0]) photoUrl = (mainPhotos[0].content as any)?.url;

    // 2. Fallback to any approved photo
    if (!photoUrl) {
      const { data: anyPhotos } = await supabase
        .from("content_submissions")
        .select("content")
        .eq("group_profile_id", profileId)
        .eq("type", "photo")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1);
      if (anyPhotos?.[0]) photoUrl = (anyPhotos[0].content as any)?.url;
    }

    // 3. Fallback to profile photos array
    if (!photoUrl && Array.isArray(profile.photos) && profile.photos.length > 0) {
      photoUrl = (profile.photos as any[])[0];
    }

    const priceText = profile.price_per_hour && Number(profile.price_per_hour) > 0
      ? `$${Number(profile.price_per_hour).toLocaleString()}/hr`
      : "Consultar precio";

    // Check if musical_group already exists
    const { data: existingGroups } = await (supabase
      .from("musical_groups")
      .select("id") as any)
      .eq("group_profile_id", profileId);
    
    const existingGroup = existingGroups?.[0];

    if (existingGroup) {
      await adminApi.call(password, {
        action: "update", table: "musical_groups", id: existingGroup.id,
        data: {
          name: profile.group_name,
          price: priceText,
          description: profile.description || "",
          image_url: photoUrl,
          category_id: matchedCategory?.id || null,
          visible: true,
        },
      });
    } else {
      await adminApi.call(password, {
        action: "insert", table: "musical_groups",
        data: {
          name: profile.group_name,
          price: priceText,
          description: profile.description || "",
          image_url: photoUrl,
          category_id: matchedCategory?.id || null,
          featured: false,
          visible: true,
          badge: "Nuevo",
          group_profile_id: profileId,
        },
      });
    }

    return profile;
  };

  const approveProfile = async (profileId: string) => {
    try {
      // 1. Update profile status
      await adminApi.call(password, {
        action: "update", table: "group_profiles", id: profileId,
        data: { status: "approved" },
      });

      // 2. Sync to musical_groups (create or update public entry)
      const profile = await syncMusicalGroup(profileId);

      toast.success(`Perfil "${profile.group_name}" aprobado y publicado automáticamente`);
      invalidateAll();
    } catch (err: any) {
      console.error("Error approving profile:", err);
      toast.error("Error al aprobar: " + err.message);
    }
  };

  const rejectProfile = async (profileId: string) => {
    try {
      await adminApi.call(password, {
        action: "update", table: "group_profiles", id: profileId,
        data: { status: "rejected" },
      });
      toast.success("Perfil rechazado");
      invalidateAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const approveSubmission = async (submission: any) => {
    try {
      const content = submission.content as any;
      const profileId = submission.group_profile_id;

      // Apply change based on type
      if (submission.type === "pricing" && profileId) {
        await adminApi.call(password, {
          action: "update", table: "group_profiles", id: profileId,
          data: { price_per_hour: content.price_per_hour, min_hours: content.min_hours },
        });
        const { data: mgs } = await (supabase.from("musical_groups").select("id") as any).eq("group_profile_id", profileId);
        if (mgs?.[0]) {
          await adminApi.call(password, {
            action: "update", table: "musical_groups", id: mgs[0].id,
            data: { price: `$${Number(content.price_per_hour).toLocaleString()}/hr` },
          });
        }
      }

      if (submission.type === "description" && profileId) {
        await adminApi.call(password, {
          action: "update", table: "group_profiles", id: profileId,
          data: { description: content.description },
        });
        const { data: mgs } = await (supabase.from("musical_groups").select("id") as any).eq("group_profile_id", profileId);
        if (mgs?.[0]) {
          await adminApi.call(password, {
            action: "update", table: "musical_groups", id: mgs[0].id,
            data: { description: content.description },
          });
        }
      }

      if (submission.type === "category" && profileId) {
        await adminApi.call(password, {
          action: "update", table: "group_profiles", id: profileId,
          data: { group_type: content.new_category },
        });
        const { data: categories } = await supabase.from("categories").select("id, title").eq("visible", true);
        const newCat = categories?.find((c) => c.title.toLowerCase().trim() === content.new_category.toLowerCase().trim());
        const { data: mgs } = await (supabase.from("musical_groups").select("id") as any).eq("group_profile_id", profileId);
        if (mgs?.[0] && newCat) {
          await adminApi.call(password, {
            action: "update", table: "musical_groups", id: mgs[0].id,
            data: { category_id: newCat.id },
          });
        }
      }

      if (submission.type === "main_photo" && profileId) {
        const { data: mgs } = await (supabase.from("musical_groups").select("id") as any).eq("group_profile_id", profileId);
        if (mgs?.[0]) {
          await adminApi.call(password, {
            action: "update", table: "musical_groups", id: mgs[0].id,
            data: { image_url: content.url },
          });
        }
      }

      // For media types (photo, main_photo, video) - also insert into centralized group_media
      if ((submission.type === "photo" || submission.type === "main_photo" || submission.type === "video") && profileId && content.url) {
        const isYoutube = content.url.includes("youtu");
        const ytId = isYoutube ? extractYtId(content.url) : "";
        await adminApi.call(password, {
          action: "insert", table: "group_media",
          data: {
            group_profile_id: profileId,
            type: isYoutube ? "youtube" : (submission.type === "video" ? "video" : "photo"),
            url: content.url,
            thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null,
            title: content.filename || (isYoutube ? "YouTube Video" : "Media"),
            uploaded_by: "admin",
          },
        });
      }

      // Mark as approved
      await adminApi.call(password, { action: "update", table: "content_submissions", id: submission.id, data: { status: "approved" } });
      toast.success("Solicitud aprobada y cambios aplicados");
      invalidateAll();
    } catch (err: any) {
      console.error("Error approving submission:", err);
      toast.error("Error: " + err.message);
    }
  };

  const rejectSubmission = async (id: string) => {
    try {
      await adminApi.call(password, { action: "update", table: "content_submissions", id, data: { status: "rejected" } });
      toast.success("Solicitud rechazada");
      invalidateAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filterByType = (type: TabKey) => {
    if (!submissions) return [];
    switch (type) {
      case "all": return submissions;
      case "photos": return submissions.filter((s: any) => s.type === "photo" || s.type === "main_photo");
      case "videos": return submissions.filter((s: any) => s.type === "video" && !(s.content as any)?.url?.includes("youtu"));
      case "youtube": return submissions.filter((s: any) => s.type === "video" && (s.content as any)?.url?.includes("youtu"));
      case "pricing": return submissions.filter((s: any) => s.type === "pricing");
      case "info": return submissions.filter((s: any) => s.type === "description" || s.type === "category");
      default: return submissions;
    }
  };

  const pendingProfileCount = pendingProfiles?.length || 0;
  const pendingCount = (type: TabKey) => filterByType(type).filter((s: any) => s.status === "pending").length;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "Todas", icon: <FileCheck className="w-4 h-4" /> },
    { key: "profiles", label: "Perfiles", icon: <UserCheck className="w-4 h-4" /> },
    { key: "photos", label: "Fotos", icon: <ImageIcon className="w-4 h-4" /> },
    { key: "videos", label: "Videos", icon: <Video className="w-4 h-4" /> },
    { key: "youtube", label: "YouTube", icon: <LinkIcon className="w-4 h-4" /> },
    { key: "pricing", label: "Precios", icon: <DollarSign className="w-4 h-4" /> },
    { key: "info", label: "Info", icon: <FileText className="w-4 h-4" /> },
  ];

  const totalPending = pendingProfileCount + (submissions?.filter((s: any) => s.status === "pending")?.length || 0);

  if (previewProfileId) {
    return (
      <div>
        <button onClick={() => setPreviewProfileId(null)} className="mb-4 px-4 py-2 rounded-xl bg-muted text-foreground font-body text-sm hover:bg-border">
          ← Volver a aprobaciones
        </button>
        <ProfilePreview profileId={previewProfileId} />
        {pendingProfiles?.find((p: any) => p.id === previewProfileId) && (
          <div className="flex gap-3 mt-6">
            <button onClick={() => { approveProfile(previewProfileId); setPreviewProfileId(null); }}
              className="flex-1 py-4 rounded-2xl bg-primary text-primary-foreground font-body font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <UserCheck className="w-5 h-5" /> ✅ Aprobar perfil
            </button>
            <button onClick={() => { rejectProfile(previewProfileId); setPreviewProfileId(null); }}
              className="flex-1 py-4 rounded-2xl bg-destructive text-destructive-foreground font-body font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <UserX className="w-5 h-5" /> ❌ Rechazar perfil
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display font-bold text-foreground text-xl mb-1 flex items-center gap-2">
        <FileCheck className="w-5 h-5 text-gold" /> Solicitudes pendientes de aprobación
      </h3>
      <p className="font-body text-sm text-muted-foreground mb-4">
        {totalPending > 0 ? `${totalPending} solicitudes pendientes` : "No hay solicitudes pendientes"}
      </p>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((t) => {
          const count = t.key === "profiles" ? pendingProfileCount : pendingCount(t.key);
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl font-body font-semibold text-sm whitespace-nowrap transition-colors",
                tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              {t.icon} {t.label}
              {count > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gold/20 text-gold text-xs">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Profiles tab */}
      {tab === "profiles" && (
        <div className="space-y-4">
          {(pendingProfiles || []).length === 0 && (
            <p className="text-muted-foreground font-body text-sm text-center py-8">No hay perfiles pendientes de aprobación.</p>
          )}
          {(pendingProfiles || []).map((p: any) => (
            <div key={p.id} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-display font-bold text-lg text-foreground">{p.group_name}</h4>
                  <p className="font-body text-sm text-muted-foreground">{p.group_type} · {p.city || "Mazatlán"}</p>
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    Precio: ${Number(p.price_per_hour || 0).toLocaleString()}/hr · Mín: {p.min_hours || 3} hrs
                  </p>
                  {p.description && <p className="font-body text-sm text-muted-foreground mt-2 line-clamp-2">{p.description}</p>}
                </div>
                <span className="px-3 py-1 rounded-lg bg-gold/20 text-gold font-body text-xs font-bold">🟡 Pendiente</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPreviewProfileId(p.id)}
                  className="flex-1 px-4 py-3 rounded-xl bg-muted text-foreground font-body font-semibold text-sm hover:bg-border flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" /> Vista previa completa
                </button>
                <button onClick={() => approveProfile(p.id)}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-body font-bold text-sm hover:opacity-90 flex items-center justify-center gap-2">
                  ✅ Aprobar perfil
                </button>
                <button onClick={() => rejectProfile(p.id)}
                  className="px-4 py-3 rounded-xl bg-destructive/10 text-destructive font-body font-bold text-sm hover:bg-destructive/20 flex items-center justify-center gap-2">
                  ❌ Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content tabs */}
      {tab !== "profiles" && (
        <div className="space-y-4">
          {filterByType(tab).length === 0 && (
            <p className="text-muted-foreground font-body text-sm text-center py-8">No hay solicitudes en esta categoría.</p>
          )}
          {filterByType(tab).map((s: any) => {
            const content = s.content as any || {};
            const groupName = s.group_profiles?.group_name || "—";
            const groupType = s.group_profiles?.group_type || "";
            const isPending = s.status === "pending";

            return (
              <div key={s.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-body font-bold text-foreground">{groupName}</p>
                      <p className="font-body text-xs text-muted-foreground">{groupType} · {new Date(s.created_at).toLocaleDateString("es-MX")}</p>
                    </div>
                    <span className={cn("px-2 py-1 rounded-lg font-body text-xs font-bold",
                      s.status === "pending" && "bg-gold/90 text-accent-foreground",
                      s.status === "approved" && "bg-primary/90 text-primary-foreground",
                      s.status === "rejected" && "bg-destructive/90 text-destructive-foreground")}>
                      {s.status === "pending" ? "🟡 Pendiente" : s.status === "approved" ? "🟢 Aprobado" : "🔴 Rechazado"}
                    </span>
                  </div>

                  {/* Type-specific content */}
                  {(s.type === "photo" || s.type === "main_photo") && content.url && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        {s.type === "main_photo" && <span className="text-xs font-body font-bold text-gold flex items-center gap-1"><Star className="w-3 h-3" /> Cambio de foto principal</span>}
                        {s.type === "photo" && <span className="text-xs font-body text-muted-foreground">📷 Nueva foto</span>}
                      </div>
                      <img src={content.url} alt="" className="w-full max-w-sm rounded-xl object-cover aspect-video" />
                    </div>
                  )}

                  {s.type === "video" && content.url && (
                    <div className="mb-3">
                      {extractYtId(content.url) ? (
                        <img src={`https://img.youtube.com/vi/${extractYtId(content.url)}/hqdefault.jpg`} alt="" className="w-full max-w-sm rounded-xl object-cover aspect-video" />
                      ) : (
                        <video src={content.url} className="w-full max-w-sm rounded-xl object-cover aspect-video" />
                      )}
                    </div>
                  )}

                  {s.type === "pricing" && (
                    <div className="mb-3 bg-muted rounded-xl p-4">
                      <p className="font-body text-xs font-bold text-muted-foreground mb-2">💰 Cambio de precio solicitado</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-destructive/10 rounded-lg p-3">
                          <p className="font-body text-xs text-destructive font-semibold mb-1">Anterior</p>
                          <p className="font-body text-sm text-foreground font-bold">${Number(content.previous_price_per_hour || 0).toLocaleString()}/hr</p>
                          <p className="font-body text-xs text-muted-foreground">Mín: {content.previous_min_hours || 3} hrs</p>
                        </div>
                        <div className="bg-primary/10 rounded-lg p-3">
                          <p className="font-body text-xs text-primary font-semibold mb-1">Nuevo</p>
                          <p className="font-body text-sm text-foreground font-bold">${Number(content.price_per_hour || 0).toLocaleString()}/hr</p>
                          <p className="font-body text-xs text-muted-foreground">Mín: {content.min_hours || 3} hrs</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {s.type === "description" && (
                    <div className="mb-3 bg-muted rounded-xl p-4">
                      <p className="font-body text-xs font-bold text-muted-foreground mb-2">📝 Cambio de descripción</p>
                      <div className="space-y-2">
                        {content.previous_description && (
                          <div className="bg-destructive/10 rounded-lg p-3">
                            <p className="font-body text-xs text-destructive font-semibold mb-1">Anterior</p>
                            <p className="font-body text-sm text-muted-foreground line-clamp-3">{content.previous_description}</p>
                          </div>
                        )}
                        <div className="bg-primary/10 rounded-lg p-3">
                          <p className="font-body text-xs text-primary font-semibold mb-1">Nueva</p>
                          <p className="font-body text-sm text-foreground">{content.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {s.type === "category" && (
                    <div className="mb-3 bg-muted rounded-xl p-4">
                      <p className="font-body text-xs font-bold text-muted-foreground mb-2">📂 Cambio de categoría</p>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive font-body text-sm font-semibold">{content.previous_category}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-body text-sm font-semibold">{content.new_category}</span>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    {isPending && (
                      <>
                        <button onClick={() => approveSubmission(s)}
                          className="flex-1 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground font-body font-bold text-sm hover:opacity-90">
                          ✅ Aprobar
                        </button>
                        <button onClick={() => rejectSubmission(s.id)}
                          className="flex-1 px-3 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-body font-bold text-sm hover:opacity-90">
                          ❌ Rechazar
                        </button>
                      </>
                    )}
                    <button onClick={() => setPreviewProfileId(s.group_profile_id)}
                      className="px-3 py-2.5 rounded-xl bg-muted text-foreground font-body text-sm hover:bg-border flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Ver perfil
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApprovalsPanel;