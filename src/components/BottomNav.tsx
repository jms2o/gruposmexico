import { useLocation, Link } from "react-router-dom";
import { Home, Clapperboard, PlusCircle, MessageSquare, User } from "lucide-react";
import { useAuth, useGroupProfile, useClientProfile } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Inicio", icon: Home, path: "/" },
  { label: "Reels", icon: Clapperboard, path: "/reels" },
  { label: "Publicar", icon: PlusCircle, path: "/publicar", isCenter: true },
  { label: "Bandeja", icon: MessageSquare, path: "/bandeja" },
  { label: "Perfil", icon: User, path: "/mi-panel" },
];

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { profile: groupProfile } = useGroupProfile(user?.id);
  const { profile: clientProfile } = useClientProfile(user?.id);

  const isMusician = !!groupProfile;
  const isClient = !!clientProfile;

  const publishPath = isMusician ? "/publicar" : "/solicitar-evento";
  const inboxPath = isMusician ? "/bandeja" : "/mis-solicitudes";
  const profilePath = isMusician ? "/mi-panel" : isClient ? "/mi-cuenta" : "/auth";

  // Musician: count unread notifications
  const { data: musicianUnread = 0 } = useQuery({
    queryKey: ["unread-notifications", groupProfile?.id],
    queryFn: async () => {
      if (!groupProfile?.id) return 0;
      const { count } = await supabase
        .from("admin_notifications")
        .select("*", { count: "exact", head: true })
        .eq("group_profile_id", groupProfile.id)
        .eq("read", false);
      return count || 0;
    },
    enabled: !!groupProfile?.id,
    refetchInterval: 15000,
  });

  // Client: count pending proposals (confirmed but not yet accepted)
  const clientTokens: string[] = JSON.parse(localStorage.getItem("event_tokens") || "[]");
  const { data: clientUnread = 0 } = useQuery({
    queryKey: ["client-unread", clientTokens, user?.id],
    queryFn: async () => {
      if (clientTokens.length === 0) return 0;
      // Get request IDs for this client
      const { data: reqs } = await supabase
        .from("event_requests")
        .select("id")
        .in("client_token", clientTokens);
      if (!reqs || reqs.length === 0) return 0;
      const reqIds = reqs.map(r => r.id);
      const { count } = await supabase
        .from("event_proposals")
        .select("*", { count: "exact", head: true })
        .in("event_request_id", reqIds)
        .eq("status", "confirmed");
      return count || 0;
    },
    enabled: clientTokens.length > 0,
    refetchInterval: 15000,
  });

  const badgeCount = isMusician ? musicianUnread : isClient ? clientUnread : 0;

  const isReelsPage = location.pathname === "/reels";

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
        isReelsPage ? "translate-y-0" : "translate-y-0"
      }`}
    >
      <div className="absolute inset-0 bg-[hsla(25,15%,5%,0.85)] backdrop-blur-xl border-t border-gold/15" />

      <div className="relative flex items-end justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.isCenter && (location.pathname === "/publicar" || location.pathname === "/solicitar-evento")) ||
            (item.path === "/bandeja" && (location.pathname === "/bandeja" || location.pathname === "/mis-solicitudes")) ||
            (item.path === "/mi-panel" && (location.pathname === "/mi-panel" || location.pathname === "/mi-cuenta"));
          const Icon = item.icon;
          
          let targetPath = item.path;
          if (item.isCenter) targetPath = publishPath;
          if (item.path === "/bandeja") targetPath = inboxPath;
          if (item.path === "/mi-panel") targetPath = profilePath;

          if (item.isCenter) {
            return (
              <Link key={item.label} to={targetPath} className="relative -mt-5 flex flex-col items-center">
                <div className="absolute -inset-1 rounded-full bg-gold/20 blur-md" />
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-lg shadow-gold/30 active:scale-95 transition-transform">
                  <Icon className="w-7 h-7 text-[hsl(25,15%,5%)]" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-body font-semibold text-gold mt-1">{item.label}</span>
              </Link>
            );
          }

          const isBandeja = item.path === "/bandeja";
          return (
            <Link key={item.label} to={targetPath}
              className="relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-colors">
              <div className="relative">
                <Icon className={`w-6 h-6 transition-colors duration-200 ${isActive ? "text-gold" : "text-white/50"}`}
                  strokeWidth={isActive ? 2.5 : 1.8} />
                {isBandeja && badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-body font-medium transition-colors duration-200 ${isActive ? "text-gold" : "text-white/40"}`}>
                {item.label}
              </span>
              {isActive && <div className="w-1 h-1 rounded-full bg-gold mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
