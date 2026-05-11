import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Home, FileText, MessageSquare, CalendarDays, CreditCard, FileSignature,
  Heart, User, Bell, Search, MapPin, Clock, DollarSign, ChevronRight,
  Calendar, Star, Music, LogOut, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadContractPdf, type ContractData } from "@/lib/contractPdf";

type Tab = "inicio" | "solicitudes" | "chats" | "eventos" | "pagos" | "contratos" | "favoritos" | "perfil";

const sidebarItems: { key: Tab; label: string; icon: any }[] = [
  { key: "inicio", label: "Inicio", icon: Home },
  { key: "solicitudes", label: "Mis solicitudes", icon: FileText },
  { key: "chats", label: "Chats con grupos", icon: MessageSquare },
  { key: "eventos", label: "Mis eventos", icon: CalendarDays },
  { key: "pagos", label: "Pagos", icon: CreditCard },
  { key: "contratos", label: "Contratos", icon: FileSignature },
  { key: "favoritos", label: "Favoritos", icon: Heart },
  { key: "perfil", label: "Perfil", icon: User },
];

const ClientDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("inicio");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Fetch client profile
  const { data: clientProfile } = useQuery({
    queryKey: ["client-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Tokens for anonymous requests
  const tokens: string[] = JSON.parse(localStorage.getItem("event_tokens") || "[]");

  // Fetch client's event requests
  const { data: requests } = useQuery({
    queryKey: ["client-dashboard-requests", user?.id, tokens],
    queryFn: async () => {
      if (!user?.id && tokens.length === 0) return [];
      // Fetch by user_id or tokens
      let query = supabase.from("event_requests").select("*").order("created_at", { ascending: false });
      if (tokens.length > 0) {
        query = query.in("client_token", tokens);
      }
      const { data } = await query;
      return data || [];
    },
    enabled: !!user?.id || tokens.length > 0,
  });

  // Fetch proposals for these requests
  const requestIds = (requests || []).map((r: any) => r.id);
  const { data: proposals } = useQuery({
    queryKey: ["client-dashboard-proposals", requestIds],
    queryFn: async () => {
      if (requestIds.length === 0) return [];
      const { data } = await supabase
        .from("event_proposals")
        .select("*, group_profiles:group_profile_id(id, group_name, city, group_type, photos, price_per_hour)")
        .in("event_request_id", requestIds)
        .in("status", ["confirmed", "accepted"])
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: requestIds.length > 0,
  });

  // Fetch contracts
  const acceptedProposalIds = (proposals || []).filter((p: any) => p.status === "accepted").map((p: any) => p.id);
  const { data: contracts } = useQuery({
    queryKey: ["client-dashboard-contracts", acceptedProposalIds],
    queryFn: async () => {
      if (acceptedProposalIds.length === 0) return [];
      const { data } = await supabase
        .from("contracts")
        .select("*")
        .in("event_proposal_id", acceptedProposalIds);
      return data || [];
    },
    enabled: acceptedProposalIds.length > 0,
  });

  // Fetch payments
  const { data: payments } = useQuery({
    queryKey: ["client-dashboard-payments", acceptedProposalIds],
    queryFn: async () => {
      if (acceptedProposalIds.length === 0) return [];
      const { data } = await supabase
        .from("payments")
        .select("*")
        .in("event_proposal_id", acceptedProposalIds);
      return data || [];
    },
    enabled: acceptedProposalIds.length > 0,
  });

  // Chat messages count
  const { data: unreadChats } = useQuery({
    queryKey: ["client-unread-chats", acceptedProposalIds],
    queryFn: async () => {
      if (acceptedProposalIds.length === 0) return 0;
      const { data } = await supabase
        .from("chat_messages")
        .select("event_proposal_id")
        .in("event_proposal_id", acceptedProposalIds)
        .eq("sender_type", "group")
        .order("created_at", { ascending: false })
        .limit(50);
      const uniqueChats = new Set((data || []).map((m: any) => m.event_proposal_id));
      return uniqueChats.size;
    },
    enabled: acceptedProposalIds.length > 0,
  });

  if (authLoading) return null;
  if (!user) { navigate("/auth"); return null; }

  const acceptedProps = (proposals || []).filter((p: any) => p.status === "accepted");
  const confirmedEvents = acceptedProps.map((prop: any) => {
    const req = (requests || []).find((r: any) => r.id === prop.event_request_id);
    const contract = (contracts || []).find((c: any) => c.event_proposal_id === prop.id);
    const payment = (payments || []).find((p: any) => p.event_proposal_id === prop.id);
    return { ...prop, request: req, contract, payment };
  });

  const totalPending = confirmedEvents
    .filter(e => !e.payment)
    .reduce((sum, e) => sum + (Number(e.price_total) * 0.05 || 0), 0);

  const upcomingCount = confirmedEvents.filter(e => {
    if (!e.request?.event_date) return false;
    return new Date(e.request.event_date) >= new Date();
  }).length;

  const handleTabChange = (tab: Tab) => {
    if (tab === "solicitudes") { navigate("/mis-solicitudes"); return; }
    if (tab === "chats") { navigate("/mis-solicitudes"); return; }
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border flex items-center gap-2">
          <Music className="w-6 h-6 text-gold" />
          <span className="font-display font-bold text-foreground text-sm tracking-wide">GRUPOSMÉXICO.COM</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm transition-all",
                  isActive
                    ? "bg-gold/15 text-gold font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
                {item.key === "chats" && (unreadChats || 0) > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-gold text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadChats}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-20 md:pb-4">
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-4.5 h-4.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border px-4 lg:px-8 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Buscar grupos, eventos..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50"
              />
            </div>
          </div>

          <div className="flex-1 lg:hidden" />

          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-gold border-2 border-card" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden">
              {clientProfile?.avatar_url ? (
                <img src={clientProfile.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <User className="w-4.5 h-4.5 text-gold" />
              )}
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-8">
          {activeTab === "inicio" && (
            <div className="max-w-5xl">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">Dashboard</h1>
              <p className="text-muted-foreground font-body text-sm mb-6">
                Hola, {clientProfile?.full_name || "Cliente"} 
              </p>

              {/* Stats cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
                <div className="bg-card border border-border rounded-2xl p-4 hover:border-gold/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-body text-xs text-muted-foreground">Próximos eventos</p>
                    <CalendarDays className="w-4 h-4 text-gold/60" />
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{upcomingCount}</p>
                  <p className="font-body text-[10px] text-muted-foreground mt-1">Eventos</p>
                </div>

                <div className="bg-card border border-gold/30 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-body text-xs text-muted-foreground">Pagos pendientes</p>
                    <CreditCard className="w-4 h-4 text-gold/60" />
                  </div>
                  <p className="text-2xl font-display font-bold text-gold">${Math.round(totalPending).toLocaleString()}</p>
                  <p className="font-body text-[10px] text-muted-foreground mt-1">MXN</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-4 hover:border-gold/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-body text-xs text-muted-foreground">Mensajes recientes</p>
                    <MessageSquare className="w-4 h-4 text-gold/60" />
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{unreadChats || 0}</p>
                  <p className="font-body text-[10px] text-muted-foreground mt-1">Chats</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-4 hover:border-gold/30 transition-all cursor-pointer" onClick={() => navigate("/todos-los-grupos")}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-body text-xs text-muted-foreground">Grupos recomendados</p>
                    <Star className="w-4 h-4 text-gold/60" />
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-7 h-7 rounded-full bg-gold/20 border-2 border-card flex items-center justify-center">
                          <Music className="w-3 h-3 text-gold" />
                        </div>
                      ))}
                    </div>
                    <span className="font-body text-xs text-gold ml-2">Ver más</span>
                  </div>
                </div>
              </div>

              {/* Confirmed events */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-display font-bold text-foreground">Eventos confirmados</h2>
                  {confirmedEvents.length > 0 && (
                    <span className="text-xs font-body text-muted-foreground">{confirmedEvents.length} evento(s)</span>
                  )}
                </div>

                {confirmedEvents.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-8 text-center">
                    <CalendarDays className="w-10 h-10 text-gold/30 mx-auto mb-3" />
                    <p className="font-body text-sm text-muted-foreground mb-3">No tienes eventos confirmados aún</p>
                    <button onClick={() => navigate("/solicitar-evento")} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-accent-foreground font-body font-bold text-xs">
                      Publicar solicitud
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {confirmedEvents.map((event: any) => {
                      const groupProfile = event.group_profiles;
                      const photoUrl = Array.isArray(groupProfile?.photos) && groupProfile.photos.length > 0 ? groupProfile.photos[0] : null;
                      const eventDate = event.request?.event_date
                        ? new Date(event.request.event_date).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })
                        : "Fecha por definir";

                      return (
                        <div key={event.id} className="bg-card border border-border rounded-2xl p-4 hover:border-gold/20 transition-all">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                              {photoUrl ? <img src={photoUrl as string} className="w-full h-full object-cover" alt="" /> : <Music className="w-6 h-6 text-muted-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-body font-bold text-foreground text-sm truncate">{groupProfile?.group_name || "Grupo"}</h3>
                              <p className="font-body text-xs text-muted-foreground capitalize">{eventDate}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {event.payment ? (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-body font-bold text-[10px] flex items-center gap-1">
                                   Anticipo pagado
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-gold/15 text-gold border border-gold/20 font-body font-bold text-[10px]">
                                   Pendiente
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-body text-muted-foreground mb-3">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gold/60" />{event.request?.city}, {event.request?.state}</span>
                            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-gold/60" />${Number(event.price_total).toLocaleString()} MXN</span>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {event.contract && (
                              <button
                                onClick={() => downloadContractPdf(event.contract as ContractData)}
                                className="py-2 px-4 rounded-xl border border-border text-foreground font-body text-xs hover:border-gold/30 transition-colors flex items-center gap-1.5"
                              >
                                <FileSignature className="w-3.5 h-3.5" /> Ver contrato
                              </button>
                            )}
                            <button
                              onClick={() => navigate("/mis-solicitudes")}
                              className="py-2 px-4 rounded-xl border border-border text-foreground font-body text-xs hover:border-gold/30 transition-colors flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Abrir chat
                            </button>
                            {!event.payment && (
                              <button
                                onClick={() => navigate("/mis-solicitudes")}
                                className="py-2 px-4 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-accent-foreground font-body font-bold text-xs flex items-center gap-1.5"
                              >
                                <CreditCard className="w-3.5 h-3.5" /> Pagar anticipo
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick action */}
              <div className="bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 rounded-2xl p-6 text-center">
                <h3 className="font-display font-bold text-foreground text-lg mb-2">¿Necesitas música para tu evento?</h3>
                <p className="font-body text-sm text-muted-foreground mb-4">Publica una solicitud y recibe propuestas de los mejores grupos</p>
                <button onClick={() => navigate("/solicitar-evento")} className="px-8 py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-accent-foreground font-body font-bold text-sm">
                  Publicar solicitud
                </button>
              </div>
            </div>
          )}

          {activeTab === "eventos" && (
            <div className="max-w-5xl">
              <h1 className="text-2xl font-display font-bold text-foreground mb-6">Mis eventos</h1>
              {confirmedEvents.length === 0 ? (
                <p className="text-muted-foreground font-body text-sm text-center py-8">No tienes eventos aún.</p>
              ) : (
                <div className="space-y-3">
                  {confirmedEvents.map((event: any) => (
                    <div key={event.id} className="bg-card border border-border rounded-2xl p-4">
                      <h3 className="font-body font-bold text-foreground">{event.group_profiles?.group_name}</h3>
                      <p className="font-body text-xs text-muted-foreground mt-1">
                        {event.request?.event_date && new Date(event.request.event_date).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">{event.request?.city}, {event.request?.state}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "pagos" && (
            <div className="max-w-5xl">
              <h1 className="text-2xl font-display font-bold text-foreground mb-6">Pagos</h1>
              {(payments || []).length === 0 ? (
                <p className="text-muted-foreground font-body text-sm text-center py-8">No hay pagos registrados.</p>
              ) : (
                <div className="space-y-3">
                  {(payments || []).map((pay: any) => (
                    <div key={pay.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-body font-bold text-foreground text-sm">{pay.client_name || "Pago"}</p>
                        <p className="font-body text-xs text-muted-foreground">{new Date(pay.created_at).toLocaleDateString("es-MX")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-body font-bold text-emerald-400 text-sm">${Number(pay.amount).toLocaleString()} MXN</p>
                        <p className="font-body text-[10px] text-muted-foreground"> Completado</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "contratos" && (
            <div className="max-w-5xl">
              <h1 className="text-2xl font-display font-bold text-foreground mb-6">Contratos</h1>
              {(contracts || []).length === 0 ? (
                <p className="text-muted-foreground font-body text-sm text-center py-8">No hay contratos generados.</p>
              ) : (
                <div className="space-y-3">
                  {(contracts || []).map((c: any) => (
                    <div key={c.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-body font-bold text-foreground text-sm">{c.group_name}</p>
                        <p className="font-body text-xs text-muted-foreground">{new Date(c.event_date).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</p>
                        <p className="font-body text-xs text-muted-foreground">{c.event_city}</p>
                      </div>
                      <button
                        onClick={() => downloadContractPdf(c as ContractData)}
                        className="py-2 px-4 rounded-xl bg-gold/10 text-gold font-body font-bold text-xs flex items-center gap-1.5 hover:bg-gold/20 transition-colors"
                      >
                        <FileSignature className="w-3.5 h-3.5" /> Descargar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "favoritos" && (
            <div className="max-w-5xl">
              <h1 className="text-2xl font-display font-bold text-foreground mb-6">Favoritos</h1>
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <Heart className="w-10 h-10 text-gold/30 mx-auto mb-3" />
                <p className="font-body text-sm text-muted-foreground mb-3">Aún no tienes grupos favoritos</p>
                <button onClick={() => navigate("/todos-los-grupos")} className="px-6 py-2.5 rounded-xl bg-gold/10 text-gold font-body font-bold text-xs">
                  Explorar grupos
                </button>
              </div>
            </div>
          )}

          {activeTab === "perfil" && (
            <div className="max-w-lg">
              <h1 className="text-2xl font-display font-bold text-foreground mb-6">Mi perfil</h1>
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-body font-bold text-foreground">{clientProfile?.full_name || "Cliente"}</h3>
                    <p className="font-body text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-body font-semibold text-muted-foreground mb-1">Ciudad</label>
                    <p className="font-body text-sm text-foreground">{clientProfile?.city || "—"}, {clientProfile?.state || "—"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-body font-semibold text-muted-foreground mb-1">Teléfono</label>
                    <p className="font-body text-sm text-foreground">{clientProfile?.phone || "No registrado"}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-body font-semibold text-muted-foreground mb-1">Miembro desde</label>
                    <p className="font-body text-sm text-foreground">
                      {clientProfile?.created_at ? new Date(clientProfile.created_at).toLocaleDateString("es-MX", { month: "long", year: "numeric" }) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;
