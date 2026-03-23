import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Clock, DollarSign, MapPin, Calendar, ChevronRight, MessageSquare, Check, User, Send, ShieldAlert, CreditCard, Lock, FileText, Download, Star, Eye, Music, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { containsContactInfo, sanitizeChatMessage, CONTACT_WARNING } from "@/lib/chatFilter";
import { downloadContractPdf, type ContractData } from "@/lib/contractPdf";

const CLIENT_SERVICE_FEE_RATE = 0.05;
type PaymentMethod = "card" | "apple_pay" | "google_pay";

const ClientInboxPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({ cardNumber: "", expiry: "", cvv: "", name: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [processingPayment, setProcessingPayment] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const tokens: string[] = JSON.parse(localStorage.getItem("event_tokens") || "[]");

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: requests } = useQuery({
    queryKey: ["client-requests", tokens, user?.id],
    queryFn: async () => {
      if (tokens.length === 0 && !user?.id) return [];
      let allData: any[] = [];
      if (tokens.length > 0) {
        const { data } = await supabase.from("event_requests").select("*").in("client_token", tokens).order("created_at", { ascending: false });
        allData = data || [];
      }
      if (user?.id) {
        const { data } = await supabase.from("event_requests").select("*").eq("client_user_id", user.id).order("created_at", { ascending: false });
        const existingIds = new Set(allData.map((r: any) => r.id));
        (data || []).forEach((r: any) => { if (!existingIds.has(r.id)) allData.push(r); });
      }
      return allData;
    },
    enabled: tokens.length > 0 || !!user?.id,
  });

  const requestIds = (requests || []).map((r: any) => r.id);

  // Fetch ALL proposals (including pending/confirmed) for counts
  const { data: allProposals } = useQuery({
    queryKey: ["client-all-proposals", requestIds],
    queryFn: async () => {
      if (requestIds.length === 0) return [];
      const { data } = await supabase
        .from("event_proposals")
        .select("*, group_profiles:group_profile_id(id, group_name, city, group_type, photos, price_per_hour)")
        .in("event_request_id", requestIds)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: requestIds.length > 0,
  });

  // Only confirmed/accepted for chat
  const proposals = (allProposals || []).filter((p: any) => ["confirmed", "accepted"].includes(p.status));

  const groupProfileIds = (allProposals || []).map((p: any) => p.group_profile_id).filter(Boolean);
  const { data: musicalGroupsMap } = useQuery({
    queryKey: ["musical-groups-by-profile", groupProfileIds],
    queryFn: async () => {
      if (groupProfileIds.length === 0) return {};
      const { data } = await supabase.from("musical_groups").select("id, group_profile_id").in("group_profile_id", groupProfileIds);
      const map: Record<string, string> = {};
      (data || []).forEach((g: any) => { if (g.group_profile_id) map[g.group_profile_id] = g.id; });
      return map;
    },
    enabled: groupProfileIds.length > 0,
  });

  const { data: membershipByGroup } = useQuery({
    queryKey: ["membership-by-group", groupProfileIds],
    queryFn: async () => {
      if (groupProfileIds.length === 0) return {} as Record<string, { commissionRate: number; membershipName: string }>;
      const { data } = await supabase
        .from("group_memberships")
        .select("group_profile_id, created_at, membership_plans:plan_id(commission_rate, name)")
        .in("group_profile_id", groupProfileIds)
        .in("status", ["active", "expired"])
        .order("created_at", { ascending: false });

      const map: Record<string, { commissionRate: number; membershipName: string }> = {};
      (data || []).forEach((item: any) => {
        if (!item?.group_profile_id || map[item.group_profile_id]) return;
        const rate = Number(item?.membership_plans?.commission_rate);
        map[item.group_profile_id] = {
          commissionRate: Number.isFinite(rate) ? rate : 15,
          membershipName: item?.membership_plans?.name || "Plan Básico",
        };
      });
      return map;
    },
    enabled: groupProfileIds.length > 0,
  });

  useQuery({
    queryKey: ["client-proposals-refresh", requestIds],
    queryFn: async () => { queryClient.invalidateQueries({ queryKey: ["client-all-proposals"] }); return null; },
    enabled: requestIds.length > 0,
    refetchInterval: 10000,
  });

  const { data: chatMessages } = useQuery({
    queryKey: ["chat-messages", activeChat],
    queryFn: async () => {
      if (!activeChat) return [];
      const { data } = await supabase.from("chat_messages").select("*").eq("event_proposal_id", activeChat).order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!activeChat,
    refetchInterval: activeChat ? 3000 : false,
  });

  const { data: contract } = useQuery({
    queryKey: ["contract", activeChat],
    queryFn: async () => {
      if (!activeChat) return null;
      const { data } = await supabase.from("contracts").select("*").eq("event_proposal_id", activeChat).maybeSingle();
      return data;
    },
    enabled: !!activeChat,
  });

  useEffect(() => {
    if (activeChat && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeChat]);

  useEffect(() => {
    if (!activeChat) return;
    const channel = supabase
      .channel(`chat-${activeChat}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `event_proposal_id=eq.${activeChat}` },
        () => queryClient.invalidateQueries({ queryKey: ["chat-messages", activeChat] })
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChat, queryClient]);

  const getGroupCommissionInfo = (groupProfileId?: string | null) => {
    if (!groupProfileId) return { commissionRate: 15, membershipName: "Plan Básico" };
    return membershipByGroup?.[groupProfileId] || { commissionRate: 15, membershipName: "Plan Básico" };
  };

  const getPaymentBreakdown = (proposal: any, eventReq: any) => {
    const priceTotal = Number(proposal?.price_total) || 0;
    const duration = Number(eventReq?.duration_hours) || 1;
    const pricePerHour = Number(proposal?.price_per_hour) > 0
      ? Number(proposal?.price_per_hour)
      : Math.round(priceTotal / Math.max(duration, 1));
    const commissionInfo = getGroupCommissionInfo(proposal?.group_profile_id);
    const depositAmount = Math.round(priceTotal * (commissionInfo.commissionRate / 100));
    const serviceFeeAmount = Math.round(priceTotal * CLIENT_SERVICE_FEE_RATE);
    const totalCharge = depositAmount + serviceFeeAmount;
    const remainingAmount = Math.max(0, priceTotal - depositAmount);

    return {
      priceTotal,
      duration,
      pricePerHour,
      commissionInfo,
      depositAmount,
      serviceFeeAmount,
      totalCharge,
      remainingAmount,
    };
  };

  const handleAccept = async (proposalId: string) => {
    const selected = (allProposals || []).find((p: any) => p.id === proposalId);
    if (!selected) return;

    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("event_proposal_id", proposalId)
      .maybeSingle();

    if (existingPayment) {
      toast.success("Este evento ya está pagado.");
      setActiveChat(proposalId);
      return;
    }

    const eventReq = (requests || []).find((r: any) => r.id === selected.event_request_id);
    setPaymentData((prev) => ({
      ...prev,
      name: eventReq?.client_name || prev.name,
    }));
    setPaymentMethod("card");
    setShowPaymentForm(true);
    setActiveChat(proposalId);
  };

  const isDepositPaid = (chatMessages || []).some(
    (m: any) => m.sender_type === "system" && (m.message.includes("Pago de anticipo recibido") || m.message.includes("Pago confirmado"))
  );

  const handleSendChat = async () => {
    if (!chatMsg.trim() || !activeChat) return;
    const raw = chatMsg.trim().slice(0, 1000);
    if (!isDepositPaid && containsContactInfo(raw)) { toast.error(CONTACT_WARNING); return; }
    const message = isDepositPaid ? raw : sanitizeChatMessage(raw);
    await supabase.from("chat_messages").insert({ event_proposal_id: activeChat, sender_type: "client", message });
    setChatMsg("");
  };

  const activeProp = (allProposals || []).find((p: any) => p.id === activeChat);

  const handleConfirmAndPay = async () => {
    if (!paymentData.name) {
      toast.error("Ingresa el nombre del titular");
      return;
    }
    if (paymentMethod === "card" && (!paymentData.cardNumber || !paymentData.expiry || !paymentData.cvv)) {
      toast.error("Completa todos los campos de pago");
      return;
    }
    if (!activeChat || !activeProp) return;

    setProcessingPayment(true);
    await new Promise(resolve => setTimeout(resolve, 1400));

    const eventReq = (requests || []).find((r: any) => r.id === activeProp.event_request_id);
    const groupProfile = activeProp.group_profiles;
    const breakdown = getPaymentBreakdown(activeProp, eventReq);

    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("event_proposal_id", activeChat)
      .maybeSingle();

    if (existingPayment) {
      setProcessingPayment(false);
      setShowPaymentForm(false);
      toast.success("Este pago ya fue registrado.");
      return;
    }

    const { error: acceptError } = await supabase
      .from("event_proposals")
      .update({ status: "accepted" })
      .eq("id", activeChat);

    if (acceptError) {
      setProcessingPayment(false);
      toast.error("No se pudo confirmar la propuesta");
      return;
    }

    await supabase
      .from("event_proposals")
      .update({ status: "cancelled" })
      .eq("event_request_id", activeProp.event_request_id)
      .neq("id", activeChat)
      .in("status", ["confirmed", "pending"]);

    // Best effort: close request to avoid new competing proposals after client payment.
    await supabase
      .from("event_requests")
      .update({ status: "closed" })
      .eq("id", activeProp.event_request_id);

    const { data: paymentRecord, error: paymentError } = await supabase.from("payments").insert({
      event_proposal_id: activeChat,
      group_profile_id: groupProfile?.id || "",
      amount: breakdown.totalCharge,
      commission_rate: breakdown.commissionInfo.commissionRate,
      total_service: breakdown.priceTotal,
      status: "completed",
      payment_method: paymentMethod,
      client_name: eventReq?.client_name || paymentData.name,
    }).select().single();

    if (paymentError || !paymentRecord) {
      setProcessingPayment(false);
      toast.error("No se pudo procesar el pago");
      return;
    }

    await supabase.from("contracts").insert({
      event_proposal_id: activeChat,
      payment_id: paymentRecord.id,
      group_profile_id: groupProfile?.id || "",
      client_name: eventReq?.client_name || paymentData.name,
      group_name: groupProfile?.group_name || "Grupo",
      event_date: eventReq?.event_date || new Date().toISOString().split("T")[0],
      event_city: eventReq ? `${eventReq.city}, ${eventReq.state}` : "",
      event_type: eventReq?.event_type || "Evento",
      duration_hours: eventReq?.duration_hours || 3,
      deposit_amount: breakdown.depositAmount,
      remaining_amount: breakdown.remainingAmount,
      total_amount: breakdown.priceTotal,
      status: "active",
      service_conditions: "El anticipo quedará resguardado en la plataforma hasta que el grupo realice la presentación. El saldo restante se liquida al músico el día del evento.",
    });

    await supabase.from("chat_messages").insert([
      {
        event_proposal_id: activeChat,
        sender_type: "system",
        message: "🎉 ¡Propuesta aceptada! Ya pueden coordinar los detalles del evento por este chat.",
      },
      {
        event_proposal_id: activeChat,
        sender_type: "system",
        message: `✅ Pago confirmado\n\n📍 ${eventReq?.city || ""}${eventReq?.state ? `, ${eventReq.state}` : ""}\n⏱ ${eventReq?.duration_hours || 3} horas\n💰 Total del servicio: $${breakdown.priceTotal.toLocaleString()} MXN\n💳 Anticipo pagado: $${breakdown.depositAmount.toLocaleString()} MXN\n🧾 Tarifa de servicio (5%): $${breakdown.serviceFeeAmount.toLocaleString()} MXN\n💵 Total cobrado hoy: $${breakdown.totalCharge.toLocaleString()} MXN\n\n📋 Se ha generado un contrato digital para este evento.\n\n🔒 Tu anticipo queda seguro en la plataforma hasta que el grupo toque.`,
      },
    ]);

    if (groupProfile?.id) {
      await supabase.from("admin_notifications").insert([
        {
          type: "proposal_accepted",
          title: "✅ Cotización aceptada",
          message: `El cliente ${eventReq?.client_name || paymentData.name} confirmó tu cotización por $${breakdown.priceTotal.toLocaleString()} MXN.`,
          group_profile_id: groupProfile.id,
        },
        {
          type: "payment_received",
          title: "💳 Pago recibido",
          message: `Se recibió anticipo de $${breakdown.depositAmount.toLocaleString()} MXN + tarifa de servicio de $${breakdown.serviceFeeAmount.toLocaleString()} MXN.`,
          group_profile_id: groupProfile.id,
        },
      ]);
    }

    setShowPaymentForm(false);
    setPaymentData({ cardNumber: "", expiry: "", cvv: "", name: "" });
    setPaymentMethod("card");
    setProcessingPayment(false);
    toast.success("Pago completado. Evento confirmado.");
    queryClient.invalidateQueries({ queryKey: ["client-all-proposals"] });
    queryClient.invalidateQueries({ queryKey: ["client-requests"] });
    queryClient.invalidateQueries({ queryKey: ["chat-messages", activeChat] });
    queryClient.invalidateQueries({ queryKey: ["contract", activeChat] });
  };

  const handleDownloadContract = () => { if (contract) downloadContractPdf(contract as ContractData); };

  const hasDepositRequest = (chatMessages || []).some((m: any) => m.sender_type === "system" && m.message.includes("Solicitud de anticipo"));
  const depositPaid = (chatMessages || []).some(
    (m: any) => m.sender_type === "system" && (m.message.includes("Pago de anticipo recibido") || m.message.includes("Pago confirmado"))
  );
  const activeEventReq = activeProp ? (requests || []).find((r: any) => r.id === activeProp.event_request_id) : null;
  const activeBreakdown = activeProp ? getPaymentBreakdown(activeProp, activeEventReq) : null;

  // Chat view
  if (activeChat && activeProp) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-20 pb-28 flex flex-col">
          <div className="sticky top-16 z-30 bg-card border-b border-border px-4 py-3">
            <div className="container max-w-2xl flex items-center gap-3">
              <button onClick={() => { setActiveChat(null); setShowPaymentForm(false); }} className="text-muted-foreground font-body text-sm">← Volver</button>
              <div className="flex-1 min-w-0">
                <p className="font-body font-bold text-foreground text-sm truncate">{activeProp.group_profiles?.group_name}</p>
                <p className="font-body text-xs text-muted-foreground">
                  {depositPaid ? "🎉 Evento confirmado" : activeProp.status === "accepted" ? "✅ Aceptada" : "⏳ Confirmada"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="container max-w-2xl space-y-3">
              {(chatMessages || []).map((msg: any) => {
                const isDepositMsg = msg.sender_type === "system" && msg.message.includes("Solicitud de anticipo");
                const isContractMsg = msg.sender_type === "system" && msg.message.includes("contrato digital");
                return (
                  <div key={msg.id}>
                    <div className={cn("flex", msg.sender_type === "system" ? "justify-center" : msg.sender_type === "client" ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[85%] px-4 py-2.5 rounded-2xl font-body text-sm",
                        msg.sender_type === "system" ? "bg-muted border border-border text-muted-foreground text-xs text-center whitespace-pre-line"
                          : msg.sender_type === "client" ? "bg-gold/15 text-foreground rounded-br-md"
                            : "bg-card border border-border text-foreground rounded-bl-md"
                      )}>
                        {msg.message}
                        {msg.sender_type !== "system" && (
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(msg.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</p>
                        )}
                      </div>
                    </div>
                    {isDepositMsg && !depositPaid && !showPaymentForm && (
                      <div className="flex justify-center mt-2">
                        <button onClick={() => setShowPaymentForm(true)} className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-accent-foreground font-body font-bold text-xs flex items-center gap-2 active:scale-95 transition-transform">
                          <CreditCard className="w-4 h-4" /> Pagar anticipo
                        </button>
                      </div>
                    )}
                    {isDepositMsg && depositPaid && (
                      <div className="flex justify-center mt-2">
                        <span className="py-2 px-4 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-body font-bold text-xs flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Anticipo pagado
                        </span>
                      </div>
                    )}
                    {isContractMsg && contract && (
                      <div className="flex justify-center mt-2">
                        <button onClick={handleDownloadContract} className="py-2.5 px-6 rounded-xl bg-primary/15 text-primary border border-primary/30 font-body font-bold text-xs flex items-center gap-2 active:scale-95 transition-transform hover:bg-primary/25">
                          <FileText className="w-4 h-4" /> Ver contrato
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {showPaymentForm && (
                <div className="bg-card border-2 border-gold/30 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-5 h-5 text-gold" />
                    <h3 className="font-body font-bold text-foreground text-sm">Confirmar y pagar</h3>
                  </div>
                  <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Pago seguro · Simulación de pago
                  </p>

                  {activeBreakdown && (
                    <div className="rounded-xl border border-gold/25 bg-background/60 p-3 space-y-1.5">
                      <p className="text-xs font-body text-muted-foreground">Evento</p>
                      <p className="text-sm font-body font-bold text-foreground">📍 {activeEventReq?.city}, {activeEventReq?.state}</p>
                      {activeEventReq?.event_address && (
                        <p className="text-xs font-body text-muted-foreground">{activeEventReq.event_address}</p>
                      )}
                      <p className="text-sm font-body text-foreground">⏱ {activeBreakdown.duration} horas · {activeEventReq?.start_time || "21:00"}</p>
                      <p className="text-sm font-body text-foreground">💵 ${activeBreakdown.pricePerHour.toLocaleString()} por hora</p>
                      <div className="pt-2 mt-2 border-t border-border/60 text-xs font-body space-y-1">
                        <div className="flex justify-between"><span>Subtotal del evento</span><span>${activeBreakdown.priceTotal.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Anticipo ({activeBreakdown.commissionInfo.commissionRate}% · {activeBreakdown.commissionInfo.membershipName})</span><span>${activeBreakdown.depositAmount.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Tarifa de servicio (5%)</span><span>${activeBreakdown.serviceFeeAmount.toLocaleString()}</span></div>
                        <div className="flex justify-between text-foreground font-bold text-sm pt-1 border-t border-border/50 mt-1">
                          <span>Total a pagar hoy</span>
                          <span>${activeBreakdown.totalCharge.toLocaleString()} MXN</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => setPaymentMethod("card")} className={cn("flex-1 py-2 px-3 rounded-lg border text-center", paymentMethod === "card" ? "bg-gold/10 border-2 border-gold/40" : "bg-muted border-border")}>
                      <p className="font-body font-bold text-foreground text-xs">💳 Tarjeta</p>
                    </button>
                    <button onClick={() => setPaymentMethod("apple_pay")} className={cn("flex-1 py-2 px-3 rounded-lg border text-center", paymentMethod === "apple_pay" ? "bg-gold/10 border-2 border-gold/40" : "bg-muted border-border")}>
                      <p className="font-body text-foreground text-xs">🍎 Apple Pay</p>
                    </button>
                    <button onClick={() => setPaymentMethod("google_pay")} className={cn("flex-1 py-2 px-3 rounded-lg border text-center", paymentMethod === "google_pay" ? "bg-gold/10 border-2 border-gold/40" : "bg-muted border-border")}>
                      <p className="font-body text-foreground text-xs">📱 Google Pay</p>
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-body font-semibold text-foreground mb-1">
                      {paymentMethod === "card" ? "Nombre en la tarjeta" : "Nombre del titular"}
                    </label>
                    <input className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50" placeholder="Juan Pérez" value={paymentData.name} onChange={(e) => setPaymentData(prev => ({ ...prev, name: e.target.value }))} />
                  </div>
                  {paymentMethod === "card" && (
                    <>
                      <div>
                        <label className="block text-xs font-body font-semibold text-foreground mb-1">Número de tarjeta</label>
                        <input className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50" placeholder="4242 4242 4242 4242" value={paymentData.cardNumber} onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: e.target.value.replace(/[^0-9\s]/g, "").slice(0, 19) }))} inputMode="numeric" maxLength={19} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-body font-semibold text-foreground mb-1">Vencimiento</label>
                          <input className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50" placeholder="MM/AA" value={paymentData.expiry} onChange={(e) => setPaymentData(prev => ({ ...prev, expiry: e.target.value.replace(/[^0-9/]/g, "").slice(0, 5) }))} maxLength={5} />
                        </div>
                        <div>
                          <label className="block text-xs font-body font-semibold text-foreground mb-1">CVV</label>
                          <input className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50" placeholder="123" value={paymentData.cvv} onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) }))} inputMode="numeric" maxLength={4} type="password" />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                    <p className="text-xs font-body text-emerald-300">
                      Tu anticipo quedará seguro en la plataforma hasta que el grupo realice la tocada.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleConfirmAndPay} disabled={processingPayment} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-accent-foreground font-body font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-transform">
                      {processingPayment ? <span className="animate-pulse">Procesando pago...</span> : <><CreditCard className="w-4 h-4" /> Confirmar y pagar</>}
                    </button>
                    <button onClick={() => setShowPaymentForm(false)} className="py-3 px-4 rounded-xl border border-border text-muted-foreground font-body text-xs">Cancelar</button>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="sticky bottom-0 bg-card border-t border-border px-4 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="container max-w-2xl">
              <p className="text-[10px] text-muted-foreground font-body text-center mb-1.5 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3 h-3" /> No se permite compartir contactos externos
              </p>
              <div className="flex gap-2">
                <input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="Escribe un mensaje..." className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50" maxLength={1000} />
                <button onClick={handleSendChat} className="w-12 h-12 rounded-xl bg-gold flex items-center justify-center active:scale-95 transition-transform">
                  <Send className="w-5 h-5 text-accent-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Empty state
  if (tokens.length === 0 && !user?.id) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 pt-20 pb-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-2"><Inbox className="w-10 h-10 text-gold/50" /></div>
          <h2 className="text-xl font-display font-bold text-foreground">Mis solicitudes</h2>
          <p className="text-muted-foreground font-body text-sm max-w-sm">Publica una solicitud de música para tu evento y las propuestas de los músicos aparecerán aquí.</p>
          <button onClick={() => navigate("/solicitar-evento")} className="btn-gold px-6 py-3 text-sm mt-2">Publicar solicitud</button>
        </div>
      </>
    );
  }

  // Main inbox view with improved offer tracking
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20 pb-28 px-4">
        <div className="container max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">Mis Solicitudes</h1>
              <p className="text-muted-foreground font-body text-xs">Ver ofertas y postulaciones de músicos</p>
            </div>
          </div>

          {/* Active requests with offer summary */}
          <div className="mb-6">
            <h2 className="text-sm font-display font-bold text-foreground mb-3">Solicitudes Activas</h2>
            {(requests || []).filter((r: any) => r.status === "open").map((req: any) => {
              const reqAllProposals = (allProposals || []).filter((p: any) => p.event_request_id === req.id);
              const bestPrice = reqAllProposals.length > 0
                ? Math.min(...reqAllProposals.map((p: any) => Number(p.price_per_hour) || Infinity))
                : 0;

              return (
                <div key={req.id} className="bg-card border border-gold/20 rounded-2xl p-4 mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-body font-bold text-foreground text-sm">{req.group_type} - {new Date(req.event_date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</h3>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">{req.city}, {req.state}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-body font-bold bg-gold/15 text-gold border border-gold/20">🟢 Abierta</span>
                  </div>

                  {/* Offer summary */}
                  <div className="bg-background/50 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <Music className="w-5 h-5 text-gold" />
                      </div>
                      <div className="flex-1">
                        <p className="font-body font-bold text-gold text-sm">{reqAllProposals.length} Ofertas Recibidas</p>
                        {bestPrice > 0 && bestPrice !== Infinity && (
                          <p className="font-body text-xs text-muted-foreground">
                            Mejor Oferta × Hora: <span className="text-foreground font-semibold">${bestPrice.toLocaleString()} MXN × Hora</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {/* scroll to proposals below */}}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-accent-foreground font-body font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Eye className="w-3.5 h-3.5" /> VER OFERTAS
                  </button>
                </div>
              );
            })}
          </div>

          {/* Proposals per request */}
          {(requests || []).map((req: any) => {
            const reqProposals = (allProposals || []).filter((p: any) => p.event_request_id === req.id);
            if (reqProposals.length === 0 && req.status === "open") return (
              <div key={req.id} className="mb-4">
                <p className="text-muted-foreground font-body text-xs text-center py-4">Esperando propuestas de músicos...</p>
              </div>
            );
            if (reqProposals.length === 0) return null;

            // Accepted proposals (confirmed groups)
            const acceptedProps = reqProposals.filter((p: any) => p.status === "accepted");

            return (
              <div key={req.id} className="mb-6">
                {/* Pending/confirmed proposals */}
                {reqProposals.filter((p: any) => ["confirmed", "pending"].includes(p.status)).length > 0 && (
                  <div className="space-y-3 mb-4">
                    {reqProposals.filter((p: any) => ["confirmed", "pending"].includes(p.status)).map((prop: any) => {
                      const groupProfile = prop.group_profiles;
                      const photoUrl = Array.isArray(groupProfile?.photos) && groupProfile.photos.length > 0 ? groupProfile.photos[0] : null;
                      return (
                        <div key={prop.id} className="bg-card border border-border rounded-2xl p-4 hover:border-gold/30 transition-all">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                              {photoUrl ? <img src={photoUrl as string} className="w-full h-full object-cover" alt="" /> : <User className="w-6 h-6 text-muted-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-body font-bold text-foreground text-sm truncate">{groupProfile?.group_name}</h4>
                              <p className="font-body text-xs text-muted-foreground">{groupProfile?.group_type} · {groupProfile?.city}</p>
                              <p className="font-body text-xs text-muted-foreground mt-0.5">
                                Postulación: <span className="text-gold font-semibold">${Number(prop.price_per_hour || 0).toLocaleString()} MXN × Hora</span>
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-body font-bold bg-gold/15 text-gold border border-gold/20">POSTULARSE</span>
                          </div>

                          {prop.message && <p className="font-body text-xs text-muted-foreground mb-3 line-clamp-2">{prop.message}</p>}

                          <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-4 h-4 text-gold" />
                            <span className="font-body font-bold text-foreground text-sm">
                              {prop.price_total ? `$${Number(prop.price_total).toLocaleString()} total` : `$${Number(prop.price_per_hour).toLocaleString()}/h`}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {prop.status === "confirmed" && (
                              <button onClick={() => handleAccept(prop.id)}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-accent-foreground font-body font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                                <CreditCard className="w-3.5 h-3.5" /> Confirmar y pagar
                              </button>
                            )}
                            <button onClick={() => {
                              const mgId = musicalGroupsMap?.[prop.group_profile_id];
                              if (mgId) navigate(`/grupo/${mgId}`);
                              else toast.error("Perfil no disponible aún");
                            }}
                              className="py-2.5 px-4 rounded-xl border border-border text-muted-foreground font-body text-xs hover:border-gold/20 transition-colors">
                              Ver Perfil
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Confirmed/accepted groups */}
                {acceptedProps.length > 0 && (
                  <div>
                    <h3 className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-gold" /> Solicitudes Confirmadas
                    </h3>
                    <div className="space-y-3">
                      {acceptedProps.map((prop: any) => {
                        const groupProfile = prop.group_profiles;
                        const photoUrl = Array.isArray(groupProfile?.photos) && groupProfile.photos.length > 0 ? groupProfile.photos[0] : null;
                        return (
                          <div key={prop.id} className="bg-card border-2 border-gold/30 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-gold/30">
                                {photoUrl ? <img src={photoUrl as string} className="w-full h-full object-cover" alt="" /> : <User className="w-6 h-6 text-muted-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-body font-bold text-foreground text-sm truncate">{groupProfile?.group_name}</h4>
                                <p className="font-body text-xs text-gold font-semibold">- CONFIRMADO -</p>
                                <p className="font-body text-xs text-muted-foreground">{groupProfile?.city}</p>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                                <Award className="w-4 h-4 text-gold" />
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => { setShowPaymentForm(false); setActiveChat(prop.id); }}
                                className="flex-1 py-2.5 rounded-xl bg-gold/15 text-gold border border-gold/30 font-body font-bold text-xs flex items-center justify-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5" /> Abrir Chat
                              </button>
                              <button onClick={() => {
                                const mgId = musicalGroupsMap?.[prop.group_profile_id];
                                if (mgId) navigate(`/grupo/${mgId}`);
                              }}
                                className="py-2.5 px-3 rounded-xl border border-border text-muted-foreground font-body text-xs">
                                Ver perfil
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ClientInboxPage;
