import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, Clock, DollarSign, Send, Loader2, ChevronDown, ChevronUp, Star, User, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  profile: any;
}

const MIN_PRICE_PER_HOUR = 1800;

const EventRequestsSection = ({ profile }: Props) => {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [proposalForm, setProposalForm] = useState<Record<string, { price: string; message: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["available-requests", profile?.city, profile?.state],
    queryFn: async () => {
      if (!profile?.city) return [];
      const { data } = await supabase
        .from("event_requests")
        .select("*")
        .eq("status", "open")
        .eq("city", profile.city)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profile?.city,
  });

  const { data: myProposals } = useQuery({
    queryKey: ["my-event-proposals", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from("event_proposals")
        .select("event_request_id, status")
        .eq("group_profile_id", profile.id);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const alreadyProposed = new Set((myProposals || []).map((p: any) => p.event_request_id));

  // Quick accept: propose with client's budget
  const handleQuickAccept = async (req: any) => {
    setSubmitting(req.id);
    const priceTotal = Number(req.budget);
    const { error } = await supabase.from("event_proposals").insert({
      event_request_id: req.id,
      group_profile_id: profile.id,
      price_total: priceTotal,
      price_per_hour: Math.round(priceTotal / req.duration_hours),
      message: `¡Acepto la solicitud! Disponible para el ${new Date(req.event_date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })} en ${req.city}.`,
      availability_confirmed: true,
    });
    setSubmitting(null);
    if (error) { toast.error("Error al aceptar solicitud"); return; }
    toast.success("¡Solicitud aceptada! El cliente podrá ver tu propuesta.");
    queryClient.invalidateQueries({ queryKey: ["my-event-proposals"] });
  };

  const handleSendProposal = async (requestId: string, req: any) => {
    const form = proposalForm[requestId];
    const pricePerHour = Number(form?.price || 0);
    if (pricePerHour < MIN_PRICE_PER_HOUR) {
      toast.error(`El precio mínimo es $${MIN_PRICE_PER_HOUR.toLocaleString()} MXN por hora`);
      return;
    }

    setSubmitting(requestId);
    const priceTotal = pricePerHour * req.duration_hours;
    const { error } = await supabase.from("event_proposals").insert({
      event_request_id: requestId,
      group_profile_id: profile.id,
      price_total: priceTotal,
      price_per_hour: pricePerHour,
      message: form?.message?.trim().slice(0, 500) || null,
      availability_confirmed: true,
    });

    setSubmitting(null);
    if (error) { toast.error("Error al enviar propuesta"); return; }
    toast.success("¡Propuesta enviada!");
    queryClient.invalidateQueries({ queryKey: ["my-event-proposals"] });
    setExpandedId(null);
  };

  const getForm = (id: string) => proposalForm[id] || { price: "", message: "" };
  const setForm = (id: string, updates: any) => setProposalForm((prev) => ({ ...prev, [id]: { ...getForm(id), ...updates } }));

  if (isLoading) return <div className="text-muted-foreground font-body text-sm animate-pulse">Cargando solicitudes...</div>;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-display font-bold text-foreground mb-1">Solicitudes disponibles</h2>
      <p className="text-muted-foreground font-body text-xs mb-4">Eventos en {profile?.city} buscando músicos · Precio mínimo: ${MIN_PRICE_PER_HOUR.toLocaleString()}/hr</p>

      {(!requests || requests.length === 0) ? (
        <p className="text-muted-foreground font-body text-sm text-center py-8">No hay solicitudes en tu ciudad por el momento.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => {
            const proposed = alreadyProposed.has(req.id);
            const isExpanded = expandedId === req.id;
            const form = getForm(req.id);
            const pricePerHourInput = Number(form.price) || 0;
            const totalEarnings = pricePerHourInput * req.duration_hours;
            const photoUrl = Array.isArray(profile?.photos) && profile.photos.length > 0 ? profile.photos[0] : null;

            return (
              <div key={req.id} className="border border-border rounded-2xl overflow-hidden hover:border-gold/20 transition-all">
                {/* Card header */}
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {/* Client avatar placeholder */}
                    <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gold/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-body font-bold text-foreground text-sm">{req.client_name}</h4>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">{req.group_type} · {req.event_type}</p>
                    </div>
                    {proposed && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-body font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Enviada
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-body text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gold/60" />{req.city}, {req.state}</div>
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gold/60" />{new Date(req.event_date).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</div>
                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gold/60" />{req.duration_hours} horas</div>
                    <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-gold/60" />${Number(req.budget).toLocaleString()} MXN</div>
                  </div>

                  {req.description && <p className="font-body text-xs text-muted-foreground line-clamp-2 mb-3">{req.description}</p>}

                  {/* Action buttons */}
                  {!proposed && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickAccept(req)}
                        disabled={submitting === req.id}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-accent-foreground font-body font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 transition-transform"
                      >
                        {submitting === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Aceptar solicitud
                      </button>
                      <button onClick={() => setExpandedId(isExpanded ? null : req.id)}
                        className="flex-1 py-2.5 rounded-xl bg-gold/10 text-gold border border-gold/20 font-body font-semibold text-xs flex items-center justify-center gap-1.5">
                        {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Cerrar</> : <><Send className="w-3.5 h-3.5" /> Enviar propuesta</>}
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded proposal form */}
                {isExpanded && !proposed && (
                  <div className="border-t border-border bg-background/50 p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-body font-semibold text-foreground mb-1.5">
                        Tu precio por hora (mínimo ${MIN_PRICE_PER_HOUR.toLocaleString()} MXN) *
                      </label>
                      <input value={form.price} onChange={(e) => setForm(req.id, { price: e.target.value.replace(/[^0-9]/g, "") })}
                        placeholder={`Mínimo $${MIN_PRICE_PER_HOUR.toLocaleString()}`}
                        className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50"
                        inputMode="numeric" />
                      {pricePerHourInput > 0 && (
                        <div className="mt-2 p-3 rounded-xl bg-gold/5 border border-gold/10">
                          <p className="font-body text-xs text-foreground">
                            <span className="text-muted-foreground">Total que recibirás:</span>{" "}
                            <span className="font-bold text-gold text-sm">${totalEarnings.toLocaleString()} MXN</span>
                          </p>
                          <p className="font-body text-[10px] text-muted-foreground mt-0.5">
                            ${pricePerHourInput.toLocaleString()}/hr × {req.duration_hours} horas
                          </p>
                        </div>
                      )}
                    </div>
                    <textarea value={form.message} onChange={(e) => setForm(req.id, { message: e.target.value })}
                      placeholder="Mensaje para el cliente (opcional)"
                      className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 h-16 resize-none"
                      maxLength={500} />
                    <button onClick={() => handleSendProposal(req.id, req)} disabled={submitting === req.id}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-accent-foreground font-body font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 transition-transform">
                      {submitting === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      {submitting === req.id ? "Enviando..." : "Confirmar propuesta"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventRequestsSection;
