import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useGroupProfile, useGroupMembership } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import VideoGallery from "@/components/dashboard/VideoGallery";
import AboutSection from "@/components/dashboard/AboutSection";
import MembershipSection from "@/components/dashboard/MembershipSection";
import PricingSection from "@/components/dashboard/PricingSection";
import CalendarSection from "@/components/dashboard/CalendarSection";
import EventRequestsSection from "@/components/dashboard/EventRequestsSection";

const GroupDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, refetch } = useGroupProfile(user?.id);
  const { membership } = useGroupMembership(profile?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const { data: submissions } = useQuery({
    queryKey: ["my-submissions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase.from("content_submissions").select("*").eq("group_profile_id", profile.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const submitContent = async (type: string, content: any) => {
    if (!profile?.id) return;
    const { error } = await supabase.from("content_submissions").insert({
      group_profile_id: profile.id,
      type,
      content,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Solicitud enviada. Pendiente de aprobación.");
    queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
  };

  const handleSendForReview = async () => {
    if (!profile?.id) return;
    if (profile.status === "rejected") {
      const { error } = await supabase.from("group_profiles").update({ status: "pending" }).eq("id", profile.id);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Perfil enviado a revisión.");
    refetch();
  };

  if (authLoading || profileLoading) return null;
  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 pt-20">
          <p className="font-body text-muted-foreground">No tienes un perfil de grupo registrado.</p>
          <Link to="/registrar-grupo" className="px-6 py-3 rounded-xl bg-foreground text-background font-body font-bold hover:opacity-90 transition-opacity">
            Registrar mi grupo
          </Link>
        </div>
      </>
    );
  }

  const isExpired = membership && membership.expires_at && new Date(membership.expires_at) < new Date();

  const mainPhotoUrl = (() => {
    if (Array.isArray(profile.photos) && profile.photos.length > 0) return (profile.photos as any[])[0];
    return null;
  })();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-16">
        {/* Banners */}
        {(isExpired || (profile.status === "hidden")) && (
          <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3">
            <div className="container flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="font-body text-sm text-destructive font-semibold">
                Tu membresía está vencida. Renueva para volver a aparecer.
              </p>
              <Link to="/membresias" className="ml-auto px-4 py-2 rounded-xl bg-gold text-accent-foreground font-body font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap">
                Renovar
              </Link>
            </div>
          </div>
        )}
        {profile.status === "rejected" && (
          <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3">
            <div className="container flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="font-body text-sm text-destructive font-semibold">
                Tu perfil fue rechazado. Revisa tu información y reenvía.
              </p>
              <button onClick={handleSendForReview} className="ml-auto px-4 py-2 rounded-xl bg-primary text-primary-foreground font-body font-bold text-sm hover:opacity-90 flex items-center gap-1.5">
                <Send className="w-4 h-4" /> Reenviar
              </button>
            </div>
          </div>
        )}

        {/* Title bar */}
        <div className="bg-foreground text-background py-3">
          <div className="container">
            <h1 className="text-center text-xl font-display font-bold">Editable Panel para Músicos</h1>
            <p className="text-center font-body text-sm opacity-80">Este panel permite que los músicos editen su perfil</p>
          </div>
        </div>

        {/* Header with cover/profile photo */}
        <div className="container max-w-5xl">
          <DashboardHeader
            profile={profile}
            mainPhotoUrl={mainPhotoUrl}
            onSignOut={() => { signOut(); navigate("/"); }}
            onRefetch={refetch}
          />
        </div>

        {/* Content sections */}
        <div className="container max-w-5xl px-4 py-8 space-y-6 md:space-y-8">
          {/* Video Gallery */}
          <VideoGallery profile={profile} />

          {/* About + Pricing - stacked on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <AboutSection profile={profile} onSubmitContent={submitContent} />
            <PricingSection profile={profile} onSubmitContent={submitContent} />
          </div>

          {/* Membership */}
          <MembershipSection profile={profile} membership={membership} />

          {/* Calendar + Event Requests + Submissions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <CalendarSection profileId={profile.id} />
            <EventRequestsSection profile={profile} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-display font-bold text-foreground mb-4">Estado de solicitudes</h2>
              {(submissions || []).length === 0 ? (
                <p className="text-muted-foreground font-body text-sm">No tienes solicitudes aún.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(submissions || []).map((s: any) => {
                    const typeLabels: Record<string, string> = {
                      photo: "📷 Foto", video: "🎥 Video", main_photo: "⭐ Foto principal",
                      description: "📝 Descripción", pricing: "💰 Precio", category: "📂 Categoría",
                    };
                    return (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-body font-semibold text-sm text-foreground truncate">{typeLabels[s.type] || s.type}</p>
                          <p className="font-body text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString("es-MX")}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg font-body text-xs font-bold whitespace-nowrap ml-2 ${
                          s.status === "pending" ? "bg-gold/20 text-gold" :
                          s.status === "approved" ? "bg-primary/20 text-primary" :
                          "bg-destructive/20 text-destructive"
                        }`}>
                          {s.status === "pending" ? "🟡 Pendiente" : s.status === "approved" ? "🟢 Aprobado" : "🔴 Rechazado"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-foreground text-background py-3 mt-8">
          <div className="container">
            <h2 className="text-center text-xl font-display font-bold">Editable Panel para Músicos</h2>
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupDashboard;
