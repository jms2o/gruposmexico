import { Check, Ticket, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReservationTicketProps {
  groupName: string;
  packageName: string;
  hours: number;
  date?: Date;
  startTime: string;
  total: number;
  whatsappUrl: string;
  heroImage?: string;
}

const ReservationTicket = ({ groupName, packageName, hours, date, startTime, total, whatsappUrl, heroImage }: ReservationTicketProps) => {
  const items = [
    { label: "Grupo", value: groupName },
    { label: "Paquete", value: packageName },
    { label: "Duración", value: `${hours} horas` },
    ...(date ? [{ label: "Fecha", value: format(date, "d 'de' MMMM, yyyy", { locale: es }) }] : []),
    ...(startTime ? [{ label: "Hora de inicio", value: startTime }] : []),
    { label: "Sonido y show completos incluidos", value: "" },
  ];

  return (
    <div className="sticky top-28">
      <div
        className="relative rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700"
        style={{
          boxShadow: `0 0 60px -10px hsl(var(--accent-dynamic) / 0.25), 0 25px 50px -12px rgba(0,0,0,0.6)`,
          border: `1px solid hsl(var(--accent-dynamic) / 0.3)`,
        }}
      >
        {/* Background image + overlays */}
        {heroImage && (
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt=""
              className="w-full h-full object-cover scale-110 blur-[2px]"
            />
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background: heroImage
              ? `linear-gradient(160deg, hsla(25,15%,5%,0.92) 0%, hsla(25,15%,7%,0.88) 40%, hsla(25,15%,4%,0.95) 100%)`
              : `linear-gradient(160deg, hsl(25,15%,10%) 0%, hsl(25,15%,7%) 100%)`,
          }}
        />
        {/* Accent glow top */}
        <div
          className="absolute top-0 left-0 right-0 h-40 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 50% -20%, hsl(var(--accent-dynamic-glow)), transparent 70%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="p-7 pb-0">
            <div className="flex items-center gap-2 mb-1">
              <Ticket className="w-5 h-5" style={{ color: `hsl(var(--accent-dynamic-glow))` }} />
              <span
                className="font-body text-[10px] tracking-[0.25em] uppercase font-bold"
                style={{ color: `hsl(var(--accent-dynamic-glow))` }}
              >
                Acceso VIP
              </span>
            </div>
            <h3 className="font-display font-bold text-2xl text-white">Reserva Premium</h3>
            <p className="font-body text-xs text-white/40 mt-1">
              Experiencia exclusiva · Confirmación inmediata
            </p>
          </div>

          {/* Divider */}
          <div className="px-7 py-4">
            <div
              className="h-px"
              style={{
                background: `linear-gradient(90deg, transparent, hsl(var(--accent-dynamic) / 0.4), transparent)`,
              }}
            />
          </div>

          {/* Price */}
          <div className="px-7 pb-4">
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-4xl font-display font-bold"
                style={{ color: `hsl(var(--accent-dynamic-glow))` }}
              >
                ${total.toLocaleString()}
              </span>
              <span className="text-white/40 font-body text-sm">MXN / {hours} hrs</span>
            </div>
          </div>

          {/* Divider */}
          <div className="px-7">
            <div
              className="h-px"
              style={{
                background: `linear-gradient(90deg, transparent, hsl(var(--accent-dynamic) / 0.3), transparent)`,
              }}
            />
          </div>

          {/* Details */}
          <div className="p-7 space-y-3.5">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `hsl(var(--accent-dynamic) / 0.15)`,
                    boxShadow: `0 0 8px hsl(var(--accent-dynamic) / 0.1)`,
                  }}
                >
                  <Check className="w-3 h-3" style={{ color: `hsl(var(--accent-dynamic-glow))` }} />
                </div>
                <span className="font-body text-sm text-white/80">
                  {item.label}{item.value ? " " : ""}
                  {item.value && <span className="font-bold text-white">{item.value}</span>}
                </span>
              </div>
            ))}
          </div>

          {/* Button */}
          <div className="px-7 pb-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-body font-bold text-base tracking-wide text-white overflow-hidden transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: `hsl(var(--accent-dynamic))`,
                boxShadow: `0 8px 32px -4px hsl(var(--accent-dynamic) / 0.4)`,
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                RESERVAR AHORA
              </span>
              {/* Shine effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(105deg, transparent 40%, hsla(0,0%,100%,0.2) 50%, transparent 60%)`,
                }}
              />
            </a>
          </div>

          {/* Footer */}
          <div className="pb-6 text-center">
            <p className="font-body text-[10px] text-white/30 tracking-wide">
              Sin cargos ocultos · Pago seguro · Garantía de evento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationTicket;
