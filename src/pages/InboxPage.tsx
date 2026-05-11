import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Clock, DollarSign, MapPin, Calendar, Inbox, Send, ChevronRight, Music, User, Check, ShieldAlert, CreditCard, Banknote, FileText, Star, Sparkles, ChevronDown, X, ExternalLink } from "lucide-react";
import { useAuth, useGroupProfile, useGroupMembership } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { containsContactInfo, sanitizeChatMessage, CONTACT_WARNING } from "@/lib/chatFilter";
import { downloadContractPdf, type ContractData } from "@/lib/contractPdf";

const InboxPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"solicitudes" | "chats" | "reservas">("solicitudes");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [proposalForm, setProposalForm] = useState<string | null>(null);
  const [proposalData, setProposalData] = useState({ price_total: "", message: "" });
  const [detailRequest, setDetailRequest] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Get group profile for logged-in user
  const { data: profile } = useQuery({
    queryKey: ["inbox-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("group_profiles")
        .select("id, group_name, city, state, group_type, price_per_hour")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Get membership for commission rate
  const { membership } = useGroupMembership(profile?.id);
  const commissionRate = membership?.membership_plans?.commission_rate
    ? Number(membership.membership_plans.commission_rate) / 100
    : 0.15;
  const commissionPercent = Math.round(commissionRate * 100);
  const membershipName = membership?.membership_plans?.name || "Gratuita";

  // Get event requests matching this group's city
  const { data: eventRequests } = useQuery({
    queryKey: ["inbox-event-requests", profile?.city, profile?.state],
    queryFn: async () => {
      if (!profile?.city || !profile?.state) return [];
      const { data } = await supabase
        .from("event_requests")
        .select("*")
        .eq("status", "open")
        .eq("state", profile.state)
        .eq("city", profile.city)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profile?.city && !!profile?.state,
  });

  // Get this group's proposals (with event request info)
  const { data: myProposals } = useQuery({
    queryKey: ["inbox-my-proposals", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from("event_proposals")
        .select("*, event_requests:event_request_id(client_name, group_type, event_type, city, state, event_address, location_lat, location_lng, event_date, start_time, budget, duration_hours, description, client_user_id)")
        .eq("group_profile_id", profile.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const acceptedProposals = (myProposals || []).filter((p: any) => p.status === "accepted");

  // Get bookings for this group
  const { data: bookings } = useQuery({
    queryKey: ["inbox-bookings", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("group_profile_id", profile.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Chat messages
  const { data: chatMessages } = useQuery({
    queryKey: ["chat-messages", activeChat],
    queryFn: async () => {
      if (!activeChat) return [];
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("event_proposal_id", activeChat)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!activeChat,
    refetchInterval: activeChat ? 3000 : false,
  });

  // Fetch contract for this proposal
  const { data: contract } = useQuery({
    queryKey: ["contract", activeChat],
    queryFn: async () => {
      if (!activeChat) return null;
      const { data } = await supabase
        .from("contracts")
        .select("*")
        .eq("event_proposal_id", activeChat)
        .maybeSingle();
      return data;
    },
    enabled: !!activeChat,
  });

  // Realtime for new requests
  useEffect(() => {
    if (!profile?.city) return;
    const channel = supabase
      .channel("new-requests")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_requests" },
        () => queryClient.invalidateQueries({ queryKey: ["inbox-event-requests"] })
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.city, queryClient]);

  // Realtime for chat
  useEffect(() => {
    if (!activeChat) return;
    const channel = supabase
      .channel(`chat-${activeChat}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `event_proposal_id=eq.${activeChat}` },
        () => queryClient.invalidateQueries({ queryKey: ["chat-messages", activeChat] })
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChat, queryClient]);

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`proposals-${profile.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_proposals", filter: `group_profile_id=eq.${profile.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["inbox-my-proposals"] })
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, queryClient]);

  useEffect(() => {
    if (activeChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeChat]);

  // Calculate net earnings
  const calcNet = (budget: number) => {
    const commission = Math.round(budget * commissionRate);
    return { gross: budget, commission, net: budget - commission };
  };

  // Accept request directly at client's budget price
  const handleAcceptRequest = async (req: any) => {
    if (!profile?.id) return;
    const priceTotal = Number(req.budget) || 0;
    if (priceTotal <= 0) { toast.error("La solicitud no tiene presupuesto válido"); return; }

    const { error } = await supabase.from("event_proposals").insert({
      event_request_id: req.id,
      group_profile_id: profile.id,
      price_total: priceTotal,
      message: `Acepto la solicitud al precio propuesto de $${priceTotal.toLocaleString()} MXN.`,
      status: "confirmed",
      availability_confirmed: true,
    });

    if (error) { toast.error("Error al aceptar solicitud"); return; }
    toast.success("¡Solicitud aceptada! El cliente puede ver tu propuesta.");
    setDetailRequest(null);
    queryClient.invalidateQueries({ queryKey: ["inbox-my-proposals"] });
    queryClient.invalidateQueries({ queryKey: ["inbox-event-requests"] });
  };

  const handleSendProposal = async (requestId: string) => {
    if (!profile?.id) return;
    const priceNum = parseFloat(proposalData.price_total.replace(/[^0-9.]/g, ""));
    if (!priceNum || priceNum <= 0) { toast.error("Ingresa un precio válido"); return; }

    const { error } = await supabase.from("event_proposals").insert({
      event_request_id: requestId,
      group_profile_id: profile.id,
      price_total: priceNum,
      message: proposalData.message.trim().slice(0, 500) || null,
      status: "confirmed",
      availability_confirmed: true,
    });

    if (error) { toast.error("Error al enviar propuesta"); return; }
    toast.success("¡Propuesta enviada! El cliente puede verla.");
    setProposalForm(null);
    setProposalData({ price_total: "", message: "" });
    setDetailRequest(null);
    queryClient.invalidateQueries({ queryKey: ["inbox-my-proposals"] });
  };

  const handleRequestDeposit = async (proposalId: string) => {
    const prop = (myProposals || []).find((p: any) => p.id === proposalId);
    if (!prop) return;
    const priceTotal = Number(prop.price_total) || 0;
    const depositAmount = Math.round(priceTotal * commissionRate);

    if (depositAmount <= 0) { toast.error("No se puede calcular el anticipo"); return; }

    const existingMessages = chatMessages || [];
    const alreadyRequested = existingMessages.some((m: any) => m.sender_type === "system" && m.message.includes("Solicitud de anticipo"));
    if (alreadyRequested) { toast.error("Ya se solicitó el anticipo para esta propuesta"); return; }

    await supabase.from("chat_messages").insert({
      event_proposal_id: proposalId,
      sender_type: "system",
      message: `Solicitud de anticipo\n\nAnticipo requerido: $${depositAmount.toLocaleString()} MXN (${commissionPercent}% del total)\nTotal del servicio: $${priceTotal.toLocaleString()} MXN\n\nEste anticipo confirma la reserva. El saldo restante se paga directamente al músico el día del evento.`,
    });

    toast.success("Solicitud de anticipo enviada al cliente");
    queryClient.invalidateQueries({ queryKey: ["chat-messages", proposalId] });
  };

  const isDepositPaid = (chatMessages || []).some(
    (m: any) => m.sender_type === "system" && (m.message.includes("Pago de anticipo recibido") || m.message.includes("Pago confirmado"))
  );

  const handleSendChat = async () => {
    if (!chatMsg.trim() || !activeChat) return;
    const raw = chatMsg.trim().slice(0, 1000);
    if (!isDepositPaid && containsContactInfo(raw)) {
      toast.error(CONTACT_WARNING);
      return;
    }
    const message = isDepositPaid ? raw : sanitizeChatMessage(raw);
    await supabase.from("chat_messages").insert({
      event_proposal_id: activeChat,
      sender_type: "group",
      sender_id: user?.id || null,
      message,
    });
    setChatMsg("");
  };

  const alreadyProposed = (requestId: string) => (myProposals || []).some((p: any) => p.event_request_id === requestId);

  if (loading) return null;

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 pt-20 pb-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <MessageSquare className="w-10 h-10 text-primary/50" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">Bandeja de entrada</h2>
          <p className="text-muted-foreground font-body text-sm max-w-sm">
            Inicia sesión para ver las solicitudes de eventos y mensajes de clientes.
          </p>
          <button onClick={() => navigate("/auth")} className="btn-gold px-6 py-3 text-sm mt-2">
            Iniciar sesión
          </button>
        </div>
      </>
    );
  }

  // Detail view for a request
  if (detailRequest) {
    const req = detailRequest;
    const budget = Number(req.budget) || 0;
    const { gross, commission, net } = calcNet(budget);
    const alreadySent = alreadyProposed(req.id);
    const locationQuery = [req.event_address, req.city, req.state].filter(Boolean).join(", ");
    const mapsQuery = encodeURIComponent(locationQuery || `${req.city}, ${req.state}`);
    const mapEmbedSrc = `https://maps.google.com/maps?q=${mapsQuery}&z=14&output=embed`;
    const mapOpenLink = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-20 pb-28">
          {/* Header */}
          <div className="sticky top-16 z-30 bg-card border-b border-border px-4 py-3">
            <div className="container max-w-2xl flex items-center gap-3">
              <button onClick={() => setDetailRequest(null)} className="text-muted-foreground font-body text-sm">← Volver</button>
              <div className="flex-1">
                <p className="font-display font-bold text-foreground text-sm">Detalle de Solicitud</p>
              </div>
            </div>
          </div>

          <div className="container max-w-2xl px-4 py-4 space-y-4">
            <div className="w-full h-44 rounded-2xl overflow-hidden border border-primary/20 relative">
              <iframe
                title="Mapa de evento"
                src={mapEmbedSrc}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute top-3 right-3">
                <a
                  href={mapOpenLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/90 backdrop-blur border border-border text-xs font-body font-semibold text-foreground hover:bg-card"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir mapa
                </a>
              </div>
            </div>

            {/* Event info card */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-display font-bold text-foreground text-base mb-4">Información del Evento</h3>
              <div className="grid grid-cols-2 gap-4 text-sm font-body">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Cliente</p>
                    <p className="text-foreground font-semibold">{req.client_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Music className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Evento</p>
                    <p className="text-foreground font-semibold">{req.event_type}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Ubicación</p>
                    <p className="text-foreground font-semibold">{req.city}, {req.state}</p>
                    {req.event_address && (
                      <p className="text-muted-foreground text-xs mt-0.5">{req.event_address}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Fecha</p>
                    <p className="text-foreground font-semibold">
                      {new Date(req.event_date).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 col-span-2">
                  <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Duración</p>
                    <p className="text-foreground font-semibold">{req.duration_hours} horas · {req.start_time || "21:00"}</p>
                  </div>
                </div>
              </div>
              {req.description && (
                <p className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground font-body">{req.description}</p>
              )}
            </div>

            {/* Payment breakdown card */}
            <div className="bg-card border border-primary/20 rounded-2xl p-5">
              <h3 className="font-display font-bold text-foreground text-base mb-1">Desglose de Pago
                <span className="text-primary text-sm font-body ml-2">(Tu Ganancia Neta)</span>
              </h3>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center font-body text-sm">
                  <span className="text-muted-foreground">Pago Bruto (Cliente paga)</span>
                  <span className="text-foreground font-bold">${gross.toLocaleString()} MXN</span>
                </div>
                <div className="flex justify-between items-center font-body text-sm">
                  <span className="text-muted-foreground">Comisión GruposMéxico ({commissionPercent}%)</span>
                  <span className="text-destructive font-bold">-${commission.toLocaleString()} MXN</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <div>
                    <p className="font-display font-bold text-foreground text-sm">Tu Ganancia Neta</p>
                    <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">TÚ RECIBES</p>
                  </div>
                  <span className="text-2xl font-display font-extrabold text-primary">${net.toLocaleString()} MXN</span>
                </div>
              </div>
              <p className="mt-3 pt-3 border-t border-border/50 text-[11px] text-muted-foreground font-body text-center">
                Membresía: {membershipName} · Comisión: {commissionPercent}%
              </p>
            </div>

            {/* Client info */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-display font-bold text-foreground text-sm mb-3">Saber Más del Cliente</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-body font-bold text-foreground text-sm">{req.client_name}</p>
                  <p className="font-body text-xs text-muted-foreground">Cliente · {req.group_type}</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            {!alreadySent && (
              <div className="space-y-3 pt-2">
                {proposalForm === req.id ? (
                  <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                    <div>
                      <label className="block text-xs font-body font-semibold text-foreground mb-1">Tu precio total (MXN) *</label>
                      <input
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                        placeholder="Ej: 15000" value={proposalData.price_total}
                        onChange={(e) => setProposalData(prev => ({ ...prev, price_total: e.target.value.replace(/[^0-9]/g, "") }))}
                        inputMode="numeric" />
                    </div>
                    <div>
                      <label className="block text-xs font-body font-semibold text-foreground mb-1">Mensaje (opcional)</label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none h-16 resize-none"
                        placeholder="Describe tu propuesta..."
                        value={proposalData.message} onChange={(e) => setProposalData(prev => ({ ...prev, message: e.target.value }))}
                        maxLength={500} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSendProposal(req.id)}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-display font-extrabold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                        <Send className="w-4 h-4" /> Enviar propuesta
                      </button>
                      <button onClick={() => setProposalForm(null)}
                        className="py-3 px-4 rounded-xl border border-border text-muted-foreground font-body text-xs">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button onClick={() => handleAcceptRequest(req)}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-display font-extrabold text-lg tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-primary/30">
                      ACEPTAR TOCADA
                    </button>
                    <button onClick={() => { setProposalForm(req.id); setProposalData({ price_total: "", message: "" }); }}
                      className="w-full py-3 rounded-xl border-2 border-primary/30 text-primary font-display font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
                      <Send className="w-4 h-4" /> Enviar propuesta personalizada
                    </button>
                  </>
                )}
              </div>
            )}
            {alreadySent && (
              <div className="text-center py-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 font-body font-bold text-sm border border-emerald-500/20">
                  <Check className="w-4 h-4" /> Ya enviaste una propuesta
                </span>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Chat view
  if (activeChat) {
    const activeProp = (myProposals || []).find((p: any) => p.id === activeChat);
    const hasDepositRequest = (chatMessages || []).some((m: any) => m.sender_type === "system" && m.message.includes("Solicitud de anticipo"));
    const depositPaid = (chatMessages || []).some(
      (m: any) => m.sender_type === "system" && (m.message.includes("Pago de anticipo recibido") || m.message.includes("Pago confirmado"))
    );
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-20 pb-28 flex flex-col">
          <div className="sticky top-16 z-30 bg-card border-b border-border px-4 py-3">
            <div className="container max-w-2xl flex items-center gap-3">
              <button onClick={() => setActiveChat(null)} className="text-muted-foreground font-body text-sm">← Volver</button>
              <div className="flex-1 min-w-0">
                <p className="font-body font-bold text-foreground text-sm">Chat con cliente</p>
                <p className="font-body text-xs text-muted-foreground">
                  {depositPaid ? "Evento confirmado" : activeProp?.status === "accepted" ? "Propuesta aceptada" : "Pendiente"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="container max-w-2xl space-y-3">
              {(chatMessages || []).length === 0 && (
                <p className="text-center text-muted-foreground font-body text-sm py-10">
                  No hay mensajes aún. El chat se activa cuando el cliente acepta tu propuesta.
                </p>
              )}
              {(chatMessages || []).map((msg: any) => {
                const isContractMsg = msg.sender_type === "system" && msg.message.includes("contrato digital");
                return (
                  <div key={msg.id}>
                    <div className={cn("flex",
                      msg.sender_type === "system" ? "justify-center" :
                      msg.sender_type === "group" ? "justify-end" : "justify-start"
                    )}>
                      <div className={cn("max-w-[85%] px-4 py-2.5 rounded-2xl font-body text-sm",
                        msg.sender_type === "system"
                          ? "bg-muted border border-border text-muted-foreground text-xs text-center whitespace-pre-line"
                          : msg.sender_type === "group"
                            ? "bg-primary/15 text-foreground rounded-br-md"
                            : "bg-card border border-border text-foreground rounded-bl-md"
                      )}>
                        {msg.message}
                        {msg.sender_type !== "system" && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(msg.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                    </div>
                    {isContractMsg && contract && (
                      <div className="flex justify-center mt-2">
                        <button
                          onClick={() => downloadContractPdf(contract as ContractData)}
                          className="py-2.5 px-6 rounded-xl bg-primary/15 text-primary border border-primary/30 font-body font-bold text-xs flex items-center gap-2 active:scale-95 transition-transform hover:bg-primary/25"
                        >
                          <FileText className="w-4 h-4" /> Ver contrato
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          </div>
          <div className="sticky bottom-0 bg-card border-t border-border px-4 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="container max-w-2xl">
              <p className="text-[10px] text-muted-foreground font-body text-center mb-1.5 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3 h-3" /> No se permite compartir contactos externos
              </p>
              {activeProp?.status === "accepted" && !hasDepositRequest && !depositPaid && (
                <button
                  onClick={() => handleRequestDeposit(activeChat)}
                  className="w-full mb-2 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-body font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-500/25 transition-colors"
                >
                  <Banknote className="w-4 h-4" /> Solicitar anticipo al cliente
                </button>
              )}
              <div className="flex gap-2">
                <input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  maxLength={1000} />
                <button onClick={handleSendChat}
                  className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center active:scale-95 transition-transform">
                  <Send className="w-5 h-5 text-primary-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  

  const statusStyles: Record<string, string> = {
    pending: "bg-primary/15 text-primary border-primary/20",
    confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    cancelled: "bg-destructive/15 text-destructive border-destructive/20",
    completed: "bg-primary/15 text-primary border-primary/20",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    completed: "Completada",
  };

  // Separate new requests (not yet proposed) from sent proposals
  const newRequests = (eventRequests || []).filter((req: any) => !alreadyProposed(req.id));
  const sentProposals = (myProposals || []).filter((p: any) => p.status === "confirmed");

  // Time ago helper
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `Hace ${days}d`;
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20 pb-28 px-4">
        <div className="container max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">Bandeja de entrada</h1>
              <p className="text-muted-foreground font-body text-xs">Solicitudes y reservaciones</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => setActiveTab("solicitudes")}
              className={cn("flex-1 py-3 rounded-xl font-body font-bold text-sm border transition-all",
                activeTab === "solicitudes" ? "bg-primary/15 text-primary border-primary/30" : "bg-card border-border text-muted-foreground"
              )}>
              Solicitudes {(newRequests.length + sentProposals.length) > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {newRequests.length + sentProposals.length}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab("chats")}
              className={cn("flex-1 py-3 rounded-xl font-body font-bold text-sm border transition-all",
                activeTab === "chats" ? "bg-primary/15 text-primary border-primary/30" : "bg-card border-border text-muted-foreground"
              )}>
              Chats {acceptedProposals.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                  {acceptedProposals.length}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab("reservas")}
              className={cn("flex-1 py-3 rounded-xl font-body font-bold text-sm border transition-all",
                activeTab === "reservas" ? "bg-primary/15 text-primary border-primary/30" : "bg-card border-border text-muted-foreground"
              )}>
              Reservas
            </button>
          </div>

          {/* Solicitudes tab */}
          {activeTab === "solicitudes" && (
            <div className="space-y-4">
              {/* NEW REQUESTS — pinned at top with gold border */}
              {newRequests.length > 0 && (
                <div className="space-y-3">
                  {newRequests.map((req: any) => {
                    const { net } = calcNet(Number(req.budget) || 0);
                    return (
                      <button key={req.id} onClick={() => setDetailRequest(req)}
                        className="w-full text-left bg-card border-2 border-primary/40 rounded-2xl p-4 hover:border-primary/60 transition-all relative overflow-hidden group active:scale-[0.99]">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                        
                        {/* NUEVA badge */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-display font-extrabold tracking-wider bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> NUEVA
                          </span>
                        </div>

                        <div className="relative">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                              <Music className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-display font-bold text-foreground text-sm">{req.group_type} solicitado para {req.event_type}</h3>
                              <p className="font-body text-xs text-muted-foreground">{req.city}, {req.state}</p>
                            </div>
                          </div>

                          {/* Info row */}
                          <div className="flex items-center gap-4 text-xs font-body text-muted-foreground mb-3">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-primary/60" />{new Date(req.event_date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary/60" />{req.duration_hours}h · {req.start_time || "21:00"}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary/60" />{req.city}</span>
                          </div>

                          {/* Net earnings highlight */}
                          <div className="flex items-center justify-between bg-background/60 rounded-xl px-3 py-2.5 border border-border/50">
                            <span className="font-body text-xs text-muted-foreground">Tu ganancia neta:</span>
                            <span className="font-display font-extrabold text-primary text-lg">${net.toLocaleString()} MXN</span>
                          </div>

                          {/* Time ago */}
                          <p className="text-[10px] text-muted-foreground font-body mt-2 text-right">{timeAgo(req.created_at)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sent proposals waiting for client */}
              {sentProposals.length > 0 && (
                <div>
                  <h3 className="font-body font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" /> Propuestas enviadas
                  </h3>
                  <div className="space-y-3">
                    {sentProposals.map((prop: any) => {
                      const req = prop.event_requests;
                      const { net } = calcNet(Number(prop.price_total) || 0);
                      return (
                        <div key={prop.id} className="bg-card border border-emerald-500/20 rounded-2xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-body font-bold text-foreground text-sm">{req?.client_name || "Cliente"}</h4>
                              <p className="font-body text-xs text-muted-foreground">{req?.group_type} · {req?.event_type}</p>
                            </div>
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-body font-bold border bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                            Enviada
                          </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-primary" />
                              <span className="font-body font-bold text-foreground text-sm">${Number(prop.price_total).toLocaleString()} MXN</span>
                            </div>
                            <span className="font-body text-xs text-primary">Neto: ${net.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {newRequests.length === 0 && sentProposals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Inbox className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-1">Sin solicitudes</h3>
                  <p className="text-muted-foreground font-body text-sm max-w-xs">
                    Cuando un cliente publique una solicitud en {profile?.city}, aparecerá aquí.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Chats tab */}
          {activeTab === "chats" && (
            <div className="space-y-3">
              {acceptedProposals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-1">Sin chats activos</h3>
                  <p className="text-muted-foreground font-body text-sm max-w-xs">
                    Cuando un cliente acepte tu propuesta, podrás chatear aquí.
                  </p>
                </div>
              ) : (
                acceptedProposals.map((prop: any) => {
                  const req = prop.event_requests;
                  return (
                    <button key={prop.id} onClick={() => setActiveChat(prop.id)}
                      className="w-full bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-all text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-body font-bold text-foreground text-sm truncate">{req?.client_name || "Cliente"}</h3>
                          <p className="font-body text-xs text-muted-foreground truncate">
                            {req?.group_type} · {req?.event_type} · {req?.city}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-body font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                            Aceptada
                          </span>
                          <span className="text-[10px] text-muted-foreground font-body">
                            ${Number(prop.price_total).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Reservas tab */}
          {activeTab === "reservas" && (
            <div className="space-y-3">
              {(!bookings || bookings.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Inbox className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-1">Sin reservas</h3>
                  <p className="text-muted-foreground font-body text-sm max-w-xs">
                    Las reservaciones confirmadas aparecerán aquí.
                  </p>
                </div>
              ) : (
                bookings.map((b: any) => (
                  <div key={b.id} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-body font-bold text-foreground text-sm truncate">{b.client_name}</h3>
                        <p className="text-muted-foreground font-body text-xs mt-0.5">
                          {new Date(b.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-body font-bold border ${statusStyles[b.status] || statusStyles.pending}`}>
                        {statusLabels[b.status] || b.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-body text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary/60" />{new Date(b.event_date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</div>
                      <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary/60" />{b.hours}h</div>
                      <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-primary/60" />${b.total?.toLocaleString()} MXN</div>
                      {b.event_address && (
                        <div className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 text-primary/60 shrink-0" /><span className="truncate">{b.event_address}</span></div>
                      )}
                    </div>
                    {b.notes && <p className="mt-3 text-xs font-body text-muted-foreground border-t border-border/50 pt-2 line-clamp-2">{b.notes}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InboxPage;
