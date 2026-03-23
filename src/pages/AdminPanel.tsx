import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useCategories, useAllGroups, useTestimonials, useFaqs } from "@/hooks/useData";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, FileText, Music, Video, Users, CalendarDays,
  DollarSign, Crown, Shield, Bell, BarChart3, Trophy, Settings,
  ArrowLeft, LogOut, Search, MessageSquare, ChevronDown, ChevronRight, Menu, X
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

import AdminDashboardHome from "@/components/admin/AdminDashboardHome";
import AdminContrataciones from "@/components/admin/AdminContrataciones";
import AdminGrupos from "@/components/admin/AdminGrupos";
import AdminVideosReels from "@/components/admin/AdminVideosReels";
import AdminUsuarios from "@/components/admin/AdminUsuarios";
import AdminCalendario from "@/components/admin/AdminCalendario";
import AdminFinanzas from "@/components/admin/AdminFinanzas";
import AdminMembresias from "@/components/admin/AdminMembresias";
import AdminModeracion from "@/components/admin/AdminModeracion";
import AdminAlertas from "@/components/admin/AdminAlertas";
import AdminReportes from "@/components/admin/AdminReportes";
import AdminRanking from "@/components/admin/AdminRanking";
import AdminConfiguracion from "@/components/admin/AdminConfiguracion";

type TabKey = "dashboard" | "contrataciones" | "grupos" | "videos" | "usuarios" | "calendario" | "finanzas" | "membresias" | "moderacion" | "alertas" | "reportes" | "ranking" | "configuracion";

const sidebarItems: { key: TabKey; label: string; icon: React.ElementType; badge?: boolean }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "contrataciones", label: "Contrataciones", icon: FileText },
  { key: "grupos", label: "Grupos", icon: Music },
  { key: "videos", label: "Videos / Reels", icon: Video },
  { key: "usuarios", label: "Usuarios", icon: Users },
  { key: "calendario", label: "Calendario de Eventos", icon: CalendarDays },
  { key: "finanzas", label: "Finanzas", icon: DollarSign },
  { key: "membresias", label: "Membresías", icon: Crown },
  { key: "moderacion", label: "Moderación", icon: Shield },
  { key: "alertas", label: "Alertas", icon: Bell, badge: true },
  { key: "reportes", label: "Reportes", icon: BarChart3 },
  { key: "ranking", label: "Ranking de Grupos", icon: Trophy },
  { key: "configuracion", label: "Configuración", icon: Settings },
];

const AdminPanel = () => {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const queryClient = useQueryClient();

  const storedPass = () => sessionStorage.getItem("admin_pass") || password;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.call(password, { action: "upsert_setting", data: { key: "test", value: "test" } });
      sessionStorage.setItem("admin_pass", password);
      setAuthed(true);
      toast.success("Acceso concedido");
    } catch {
      toast.error("Contraseña incorrecta");
    }
  };

  useEffect(() => {
    if (authed) {
      supabase.rpc("check_expired_memberships" as any).then(() => {});
    }
  }, [authed]);

  const { data: unreadNotifications } = useQuery({
    queryKey: ["admin-unread-count"],
    queryFn: async () => {
      if (!storedPass()) return [];
      return adminApi.read(storedPass(), { table: "admin_notifications", filters: [{ column: "read", op: "eq", value: false }] });
    },
    enabled: authed,
  });
  const unreadCount = unreadNotifications?.length || 0;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "hsl(230 15% 8%)" }}>
        <form onSubmit={handleLogin} className="rounded-2xl p-8 w-full max-w-sm border" style={{ background: "hsl(230 15% 11%)", borderColor: "hsl(230 10% 18%)" }}>
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Music className="w-7 h-7" style={{ color: "hsl(40 65% 50%)" }} />
            <h1 className="text-2xl font-display font-bold" style={{ color: "hsl(0 0% 95%)" }}>GRUPOS MX</h1>
          </div>
          <p className="text-center text-xs mb-4 tracking-widest uppercase" style={{ color: "hsl(230 10% 50%)" }}>Admin Panel</p>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña maestra"
            className="w-full px-4 py-3 rounded-xl font-body mb-4 focus:ring-2 outline-none text-sm"
            style={{ background: "hsl(230 15% 14%)", border: "1px solid hsl(230 10% 20%)", color: "hsl(0 0% 90%)" }} />
          <button type="submit" className="w-full py-3 rounded-xl font-body font-bold text-sm transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, hsl(265 60% 55%), hsl(280 50% 45%))", color: "white" }}>
            Entrar
          </button>
          <Link to="/" className="block text-center text-sm mt-4 hover:underline" style={{ color: "hsl(230 10% 50%)" }}>← Volver al sitio</Link>
        </form>
      </div>
    );
  }

  const refresh = () => queryClient.invalidateQueries();

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(230 15% 8%)", color: "hsl(0 0% 90%)" }}>
      {/* Mobile overlay */}
      {mobileSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileSidebar(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 h-screen z-50 flex flex-col transition-all duration-300 border-r",
        mobileSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        sidebarOpen ? "w-64" : "w-16"
      )} style={{ background: "hsl(230 15% 10%)", borderColor: "hsl(230 10% 16%)" }}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b" style={{ borderColor: "hsl(230 10% 16%)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, hsl(265 60% 55%), hsl(280 50% 45%))" }}>
            <Music className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-display font-bold text-sm" style={{ color: "hsl(0 0% 95%)" }}>GRUPOS MX</p>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: "hsl(230 10% 45%)" }}>Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); setMobileSidebar(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body transition-all relative",
                  isActive
                    ? "font-semibold"
                    : "hover:bg-[hsl(230,10%,14%)]"
                )}
                style={isActive ? {
                  background: "linear-gradient(135deg, hsl(265 60% 55% / 0.15), hsl(280 50% 45% / 0.1))",
                  color: "hsl(265 70% 70%)",
                } : { color: "hsl(230 10% 55%)" }}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full" style={{ background: "hsl(265 60% 55%)" }} />}
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
                {item.badge && sidebarOpen && unreadCount && unreadCount > 0 ? (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: "hsl(0 70% 50%)" }}>{unreadCount}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t" style={{ borderColor: "hsl(230 10% 16%)" }}>
            <div className="rounded-xl p-3" style={{ background: "linear-gradient(135deg, hsl(265 60% 55% / 0.1), hsl(280 50% 45% / 0.05))" }}>
              <p className="font-body text-xs font-semibold" style={{ color: "hsl(0 0% 85%)" }}>Soporte 24/7</p>
              <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "hsl(142 70% 50%)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" /> En línea
              </p>
              <button className="mt-2 w-full py-1.5 rounded-lg font-body text-xs font-semibold"
                style={{ background: "hsl(265 60% 55%)", color: "white" }}>
                Contactar
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b sticky top-0 z-30"
          style={{ background: "hsl(230 15% 10%)", borderColor: "hsl(230 10% 16%)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebar(true)} className="md:hidden p-1.5 rounded-lg" style={{ color: "hsl(230 10% 55%)" }}>
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:block p-1.5 rounded-lg hover:bg-[hsl(230,10%,14%)]" style={{ color: "hsl(230 10% 55%)" }}>
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="p-1.5 rounded-lg hover:bg-[hsl(230,10%,14%)]" style={{ color: "hsl(230 10% 55%)" }}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "hsl(230 15% 13%)", border: "1px solid hsl(230 10% 18%)" }}>
              <Search className="w-4 h-4" style={{ color: "hsl(230 10% 40%)" }} />
              <input placeholder="Buscar (Grupos, Eventos, Usuarios...)" className="bg-transparent outline-none font-body text-sm w-72" style={{ color: "hsl(0 0% 85%)" }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-xl relative hover:bg-[hsl(230,10%,14%)]" style={{ color: "hsl(230 10% 55%)" }}>
              <Bell className="w-5 h-5" />
              {unreadCount && unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{ background: "hsl(0 70% 50%)" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>
            <button className="p-2 rounded-xl hover:bg-[hsl(230,10%,14%)]" style={{ color: "hsl(230 10% 55%)" }}>
              <MessageSquare className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-xl hover:bg-[hsl(230,10%,14%)]" style={{ color: "hsl(230 10% 55%)" }}>
              <Settings className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l" style={{ borderColor: "hsl(230 10% 20%)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, hsl(265 60% 55%), hsl(280 50% 45%))" }}>SA</div>
              <div className="hidden md:block">
                <p className="font-body text-xs font-semibold" style={{ color: "hsl(0 0% 90%)" }}>Super Admin</p>
                <p className="text-[10px] flex items-center gap-1" style={{ color: "hsl(142 70% 50%)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" /> Online
                </p>
              </div>
            </div>
            <button onClick={() => { sessionStorage.removeItem("admin_pass"); setAuthed(false); }}
              className="p-2 rounded-xl hover:bg-[hsl(230,10%,14%)]" style={{ color: "hsl(230 10% 55%)" }}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {activeTab === "dashboard" && <AdminDashboardHome password={storedPass()} />}
          {activeTab === "contrataciones" && <AdminContrataciones password={storedPass()} />}
          {activeTab === "grupos" && <AdminGrupos password={storedPass()} onRefresh={refresh} />}
          {activeTab === "videos" && <AdminVideosReels password={storedPass()} />}
          {activeTab === "usuarios" && <AdminUsuarios password={storedPass()} />}
          {activeTab === "calendario" && <AdminCalendario password={storedPass()} />}
          {activeTab === "finanzas" && <AdminFinanzas password={storedPass()} />}
          {activeTab === "membresias" && <AdminMembresias password={storedPass()} onRefresh={refresh} />}
          {activeTab === "moderacion" && <AdminModeracion password={storedPass()} />}
          {activeTab === "alertas" && <AdminAlertas password={storedPass()} />}
          {activeTab === "reportes" && <AdminReportes password={storedPass()} />}
          {activeTab === "ranking" && <AdminRanking password={storedPass()} />}
          {activeTab === "configuracion" && <AdminConfiguracion password={storedPass()} onRefresh={refresh} />}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
