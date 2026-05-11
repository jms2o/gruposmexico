import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, Send, Loader2, Clock, ChevronRight, User, Music, Guitar, Mic, Headphones, Piano, Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth, useClientProfile } from "@/hooks/useAuth";
import { Slider } from "@/components/ui/slider";
import EventLocationMap from "@/components/EventLocationMap";
import type { PostgrestError } from "@supabase/supabase-js";

const GROUP_TYPES = [
  { label: "DJ", icon: Headphones },
  { label: "Banda", icon: Music2 },
  { label: "Norteño", icon: Guitar },
  { label: "Mariachi", icon: Music },
  { label: "Versátil", icon: Mic },
  { label: "Sierreño", icon: Guitar },
  { label: "Norteño Sax", icon: Music },
  { label: "Tecladista", icon: Piano },
];

const DURATION_OPTIONS = [
  { label: "3 horas", value: 3 },
  { label: "4 horas", value: 4 },
  { label: "5 horas", value: 5 },
  { label: "Evento completo", value: 8 },
];

const HOUR_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

const PRICE_PER_HOUR_BASE = 1800;
const PRICE_MAX = 50000;

const createClientToken = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const formatDbError = (error: PostgrestError | null) => {
  if (!error) return "Error desconocido";
  const chunks = [error.message, error.details, error.hint, error.code].filter(Boolean);
  return chunks.join(" | ");
};

const EventRequestPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile: clientProfile } = useClientProfile(user?.id);
  const [submitting, setSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [form, setForm] = useState({
    client_name: "",
    group_type: "",
    state: "Sinaloa",
    city: "Mazatlán",
    address: "",
    event_date: undefined as Date | undefined,
    start_time: "21:00",
    duration_hours: 3,
    price_per_hour: PRICE_PER_HOUR_BASE,
    event_type: "Fiesta privada",
    description: "",
    location_lat: null as number | null,
    location_lng: null as number | null,
  });

  useEffect(() => {
    if (clientProfile?.full_name && !form.client_name) {
      setForm(prev => ({ ...prev, client_name: clientProfile.full_name }));
    }
  }, [clientProfile]);

  const totalEstimated = form.price_per_hour * form.duration_hours;

  const handleChange = (key: string, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "state") next.city = "";
      return next;
    });
  };

  const handleDateSelect = (d: Date | undefined) => {
    handleChange("event_date", d);
    if (d) setCalendarOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.client_name.trim()) { toast.error("Ingresa tu nombre"); return; }
    if (!form.group_type) { toast.error("Selecciona tipo de grupo"); return; }
    if (!form.state || !form.city) { toast.error("Selecciona estado y ciudad"); return; }
    if (!form.event_date) { toast.error("Selecciona la fecha del evento"); return; }

    setSubmitting(true);
    const clientToken = createClientToken();
    const basePayload = {
      client_name: form.client_name.trim().slice(0, 100),
      group_type: form.group_type,
      state: form.state,
      city: form.city,
      event_date: form.event_date.toISOString().split("T")[0],
      duration_hours: form.duration_hours,
      budget: form.price_per_hour * form.duration_hours,
      event_type: form.event_type,
      description: form.description.trim().slice(0, 500) || null,
      client_token: clientToken,
    };

    const payloadV2 = {
      ...basePayload,
      event_address: form.address.trim() || null,
      start_time: form.start_time,
      location_lat: form.location_lat,
      location_lng: form.location_lng,
      client_user_id: user?.id || null,
    };

    let { error } = await supabase.from("event_requests").insert(payloadV2);

    // Compatibilidad con esquemas antiguos (sin columnas nuevas)
    if (error && (error.code === "PGRST204" || error.message.toLowerCase().includes("column"))) {
      const legacyResult = await supabase.from("event_requests").insert(basePayload);
      error = legacyResult.error;
    }

    setSubmitting(false);

    if (error) {
      const detail = formatDbError(error);
      console.error("Error creando event_request:", error);
      toast.error("Error al publicar solicitud", { description: detail });
      return;
    }

    const tokens = JSON.parse(localStorage.getItem("event_tokens") || "[]");
    if (!tokens.includes(clientToken)) {
      tokens.push(clientToken);
      localStorage.setItem("event_tokens", JSON.stringify(tokens));
    }

    toast.success("¡Solicitud publicada! Los músicos de tu ciudad podrán postularse.");
    navigate("/mis-solicitudes");
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-nav px-4 py-3">
        <h1 className="text-center font-display font-bold text-lg text-foreground">Mi solicitud</h1>
        <p className="text-center text-xs font-body text-muted-foreground">Escribe tu solicitud y envíala a músicos cercanos</p>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">
        {/* Profile Card */}
        <div className="gold-card-frame-subtle rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/30">
            {clientProfile?.avatar_url ? (
              <img src={clientProfile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-foreground text-sm truncate">Mi solicitud</p>
            <p className="text-xs text-muted-foreground font-body">Haz tu solicitud para recibir ofertas en minutos</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>

        {/* Client Name (if not auto-filled) */}
        {!clientProfile?.full_name && (
          <div>
            <label className="block text-xs font-body font-semibold text-muted-foreground mb-1.5">Tu nombre</label>
            <input
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground font-body text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
              placeholder="Nombre completo"
              value={form.client_name}
              onChange={(e) => handleChange("client_name", e.target.value)}
              maxLength={100}
            />
          </div>
        )}

        {/* Tipo de Grupo */}
        <div>
          <h3 className="font-body font-bold text-foreground text-sm mb-2.5">Tipo de Grupo</h3>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {GROUP_TYPES.map((t) => (
              <button
                key={t.label}
                onClick={() => handleChange("group_type", t.label)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-body font-semibold border whitespace-nowrap transition-all flex-shrink-0",
                  form.group_type === t.label
                    ? "bg-primary/15 text-primary border-primary/40 neon-glow-gold"
                    : "bg-card border-border text-muted-foreground hover:border-primary/20"
                )}
              >
                <t.icon className="w-4 h-4 text-primary" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Map */}
        <EventLocationMap
          state={form.state}
          city={form.city}
          address={form.address}
          latitude={form.location_lat}
          longitude={form.location_lng}
          onStateChange={(v) => handleChange("state", v)}
          onCityChange={(v) => handleChange("city", v)}
          onAddressChange={(v) => handleChange("address", v)}
          onCoordinatesChange={(lat, lng) => {
            handleChange("location_lat", lat);
            handleChange("location_lng", lng);
          }}
        />

        {/* Date picker - auto-closes on select */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-primary/25 bg-card hover:border-primary/40 transition-colors">
              <CalendarIcon className="w-5 h-5 text-primary flex-shrink-0" />
              <span className={cn("font-body text-sm flex-1 text-left", form.event_date ? "text-foreground font-semibold" : "text-muted-foreground")}>
                {form.event_date
                  ? format(form.event_date, "d MMM yyyy", { locale: es })
                  : "Seleccionar fecha"
                }
              </span>
              <ChevronRight className="w-4 h-4 text-primary" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={form.event_date}
              onSelect={handleDateSelect}
              disabled={(d) => d < startOfDay(new Date())}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Hour Selector */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-body font-bold text-foreground text-sm">Hora de inicio</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {["17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00"].map((h) => (
              <button
                key={h}
                onClick={() => handleChange("start_time", h)}
                className={cn(
                  "py-2.5 rounded-xl text-xs font-body font-semibold border transition-all text-center",
                  form.start_time === h
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "bg-card border-border text-muted-foreground hover:border-primary/20"
                )}
              >
                {h}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground font-body mt-1.5 text-center">
            ¿Otra hora? Selecciona aquí:
            <select
              value={form.start_time}
              onChange={(e) => handleChange("start_time", e.target.value)}
              className="ml-1 bg-transparent text-primary font-semibold focus:outline-none cursor-pointer"
            >
              {HOUR_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </p>
        </div>

        {/* Duration */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-body font-bold text-foreground text-sm">Duración del evento</h3>
          </div>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => handleChange("duration_hours", d.value)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-xs font-body font-semibold border transition-all text-center",
                  form.duration_hours === d.value
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "bg-card border-border text-muted-foreground hover:border-primary/20"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground font-body mt-1.5 text-right">(mínimo 3 horas)</p>
        </div>

        {/* Price Slider */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="font-body text-sm text-foreground">
              Por <span className="font-bold">{form.duration_hours}</span> horas quiero pagar
            </p>
            <span className="px-3 py-1 rounded-lg bg-primary/15 border border-primary/30 text-primary font-display font-bold text-sm">
              ${form.price_per_hour.toLocaleString()}/hr
            </span>
          </div>

          <div className="py-5 px-1">
            <Slider
              value={[form.price_per_hour]}
              onValueChange={([v]) => handleChange("price_per_hour", v)}
              min={PRICE_PER_HOUR_BASE}
              max={PRICE_MAX}
              step={100}
              className="w-full [&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:border-primary [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-primary/30 [&_.relative]:h-3 [&_.relative]:rounded-full"
            />
          </div>

          <div className="flex justify-between text-[10px] font-body text-muted-foreground">
            <span>${PRICE_PER_HOUR_BASE.toLocaleString()}/hr</span>
            <span>${PRICE_MAX.toLocaleString()}/hr</span>
          </div>

          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground font-body">Total estimado del evento</p>
            <p className="text-2xl font-display font-bold text-primary">
              ${totalEstimated.toLocaleString()} <span className="text-sm text-muted-foreground font-body">MXN</span>
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 rounded-2xl btn-gold text-base font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {submitting ? "Publicando..." : "Enviar solicitud"}
        </button>

        <p className="text-[10px] text-muted-foreground font-body text-center pb-4">
           La comunicación será exclusivamente por el chat de la aplicación
        </p>
      </div>
    </div>
  );
};

export default EventRequestPage;
