import { useParams, Link, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { Star, MapPin, Music, Clock, Users, Check, ChevronLeft, ChevronRight, CalendarIcon, MessageCircle, Volume2 } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ReservationTicket from "@/components/ReservationTicket";
import ParticlesEffect from "@/components/group-detail/ParticlesEffect";
import { useGroupById, useWhatsappNumber } from "@/hooks/useData";
import { useDominantColor } from "@/hooks/useDominantColor";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { stripEmojis, stripEmojisDeep } from "@/lib/text";

import bandaImg from "@/assets/banda-sinaloense.jpg";
import mariachisImg from "@/assets/mariachis.jpg";
import versatilImg from "@/assets/grupo-versatil.jpg";

const fallbackImages = [bandaImg, mariachisImg, versatilImg];
const hourOptions = [3, 4, 5, 6, 7, 8];

function parseBasePrice(priceStr: string): number {
  const match = priceStr.replace(/,/g, "").match(/\d+/);
  return match ? parseInt(match[0], 10) : 4000;
}

function extractYtId(url: string) {
  const m = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] || "";
}

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { data: group, isLoading } = useGroupById(id);
  const heroRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); setLoaded(false); }, [id]);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 100); return () => clearTimeout(t); }, []);

  // Parallax
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const { data: whatsappNumber } = useWhatsappNumber();
  const num = whatsappNumber || "5216691234567";

  const groupProfileId = group?.group_profile_id;
  const heroImage = group?.image_url || fallbackImages[0];
  const { color, cssVars, isReady: colorReady } = useDominantColor(heroImage);

  // Fetch photos
  const { data: dbPhotos } = useQuery({
    queryKey: ["public-media-photos", groupProfileId],
    queryFn: async () => {
      if (!groupProfileId) return [];
      const { data } = await supabase
        .from("group_media").select("*")
        .eq("group_profile_id", groupProfileId).eq("type", "photo")
        .order("created_at", { ascending: false });
      return stripEmojisDeep(data || []);
    },
    enabled: !!groupProfileId,
  });

  // Fetch videos
  const { data: dbVideos } = useQuery({
    queryKey: ["public-media-videos", groupProfileId],
    queryFn: async () => {
      if (!groupProfileId) return [];
      const { data } = await supabase
        .from("group_media").select("*")
        .eq("group_profile_id", groupProfileId)
        .in("type", ["video", "youtube"])
        .order("created_at", { ascending: false });
      return stripEmojisDeep(data || []);
    },
    enabled: !!groupProfileId,
  });

  const { data: soundPackages } = useQuery({
    queryKey: ["sound-packages-public"],
    queryFn: async () => {
      const { data } = await supabase.from("sound_packages").select("*").eq("visible", true).order("sort_order");
      return stripEmojisDeep(data || []);
    },
  });

  const { data: category } = useQuery({
    queryKey: ["group-category", group?.category_id],
    queryFn: async () => {
      if (!group?.category_id) return null;
      const { data } = await supabase.from("categories").select("*").eq("id", group.category_id).maybeSingle();
      return stripEmojisDeep(data);
    },
    enabled: !!group?.category_id,
  });

  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [hours, setHours] = useState(3);
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState("18:00");
  const [address, setAddress] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const packages = soundPackages || [];
  const selectedPkg = packages.find((p: any) => p.id === selectedPackageId) || packages[0];

  const basePrice = group ? parseBasePrice(group.price) : 0;
  const hasPriceConfigured = basePrice > 0;
  const pkgPrice = selectedPkg ? Number(selectedPkg.price) : 0;
  const total = useMemo(() => basePrice * hours + pkgPrice, [basePrice, hours, pkgPrice]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-[hsl(25,15%,7%)]">
          <div className="animate-pulse text-white/50 font-body">Cargando...</div>
        </div>
      </>
    );
  }

  if (!group) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(25,15%,7%)] gap-4">
          <p className="text-xl font-body text-white/60">Grupo no encontrado</p>
          <Link to="/" className="btn-whatsapp px-6 py-3">Volver al inicio</Link>
        </div>
      </>
    );
  }

  const activePkgId = selectedPackageId || (packages[0]?.id ?? "");
  const breadcrumbCity = stripEmojis(searchParams.get("ciudad") || group.city || "");
  const breadcrumbState = stripEmojis(searchParams.get("estado") || group.state || "");
  const cityParams = new URLSearchParams();
  if (breadcrumbState) cityParams.set("estado", breadcrumbState);
  if (breadcrumbCity) cityParams.set("ciudad", breadcrumbCity);
  const cityLink = `/todos-los-grupos${cityParams.toString() ? `?${cityParams.toString()}` : ""}`;
  const categoryParams = new URLSearchParams(cityParams.toString());
  if (category?.id) categoryParams.set("categoria", category.id);
  const categoryLink = `/todos-los-grupos${categoryParams.toString() ? `?${categoryParams.toString()}` : ""}`;

  const whatsappMessage = encodeURIComponent(
    `Hola, quiero reservar a *${group.name}*\n` +
    `Paquete: ${selectedPkg?.name || "Sin paquete"}\n` +
    `Duración: ${hours} horas\n` +
    (date ? `Fecha: ${format(date, "PPP", { locale: es })}\n` : "") +
    `Hora: ${startTime}\n` +
    (address ? `Dirección: ${address}\n` : "") +
    `Total: $${total.toLocaleString()} MXN`
  );
  const whatsappUrl = `https://wa.me/${num}?text=${whatsappMessage}`;

  const accentHsl = `hsl(${color.h} ${color.s}% ${color.l}%)`;
  const accentGlow = `hsl(${color.h} ${Math.min(color.s + 10, 100)}% ${Math.min(color.l + 15, 75)}%)`;

  return (
    <div style={cssVars} className="bg-[hsl(25,15%,7%)] min-h-screen">
      <Navbar />

      {/* Breadcrumb */}
      <div className="pt-20 bg-[hsl(25,15%,7%)]">
        <div className="container px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm font-body text-white/40">
            <Link to="/" className="hover:text-white/70 transition-colors">Inicio</Link>
            {breadcrumbCity && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link to={cityLink} className="hover:text-white/70 transition-colors">{breadcrumbCity}</Link>
              </>
            )}
            {category && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link to={categoryLink} className="hover:text-white/70 transition-colors">{category.title}</Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/80 font-semibold">{group.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero - Cinematic */}
      <section
        ref={heroRef}
        className={cn(
          "relative h-[65vh] md:h-[75vh] overflow-hidden transition-opacity duration-700",
          loaded ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Parallax image */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translateY(${scrollY * 0.3}px) scale(1.1)` }}
        >
          <img src={heroImage} alt={group.name} className="w-full h-full object-cover" />
        </div>

        {/* Cinematic overlay - deep dramatic gradient */}
        <div className="absolute inset-0" style={{
          background: `linear-gradient(to bottom, hsla(25,15%,5%,0.1) 0%, hsla(25,15%,5%,0.3) 20%, hsla(25,15%,5%,0.7) 55%, hsla(25,15%,5%,0.92) 75%, hsl(25,15%,7%) 100%)`
        }} />

        {/* Vignette edges */}
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 40%, hsla(25,15%,4%,0.7) 100%)`
        }} />

        {/* Color accent radial glow */}
        <div className="absolute inset-0 mix-blend-soft-light opacity-30" style={{
          background: `radial-gradient(ellipse at 50% 70%, ${accentHsl}, transparent 60%)`
        }} />

        {/* Warm light bloom at bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[40%] opacity-15" style={{
          background: `radial-gradient(ellipse at 50% 100%, ${accentGlow}, transparent 70%)`
        }} />

        {/* Particles / sparks */}
        <ParticlesEffect color={color} count={30} />

        {/* Back button */}
        <div className="absolute top-6 left-6 z-10">
          <Link
            to={category ? categoryLink : cityLink || "/todos-los-grupos"}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white font-body text-sm transition-all bg-black/30 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 hover:border-white/20"
          >
            <ChevronLeft className="w-4 h-4" /> Regresar
          </Link>
        </div>

        {/* Hero content */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-6 md:p-12 transition-all duration-700 delay-200",
          loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        )}>
          <div className="container">
            {/* Rating */}
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" style={{ color: accentHsl }} />
              ))}
              <span className="text-white/50 font-body text-sm ml-2">5.0</span>
            </div>

            {/* Name with glow */}
             <h1
               className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-3 leading-[0.95]"
               style={{
                 textShadow: `0 0 30px ${accentHsl}, 0 0 60px hsla(${color.h},${color.s}%,${color.l}%,0.5), 0 0 120px hsla(${color.h},${color.s}%,${color.l}%,0.2), 0 2px 4px rgba(0,0,0,0.8)`,
               }}
             >
               {group.name}
             </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-white/60 font-body text-sm mb-6">
              {category && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5">
                  <Music className="w-3.5 h-3.5" /> {category.title}
                </span>
              )}
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5">
                <MapPin className="w-3.5 h-3.5" /> {group.city || "México"}{group.state ? `, ${group.state}` : ""}
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <a
                href="#reservar"
                className="group relative overflow-hidden px-7 py-3.5 rounded-xl font-body font-bold text-sm text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl"
                style={{
                  background: accentHsl,
                  boxShadow: `0 8px 32px -4px hsla(${color.h},${color.s}%,${color.l}%,0.4)`,
                }}
              >
                <span className="relative z-10">Reservar ahora</span>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                  background: `linear-gradient(135deg, transparent, hsla(0,0%,100%,0.2), transparent)`
                }} />
              </a>
              <a
                href="#paquetes"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/20 text-white font-body font-semibold text-sm hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              >
                Ver paquetes
              </a>
            </div>
          </div>
        </div>

        {/* Bottom accent line with glow */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{
          background: `linear-gradient(90deg, transparent 10%, ${accentHsl} 50%, transparent 90%)`,
          boxShadow: `0 0 20px ${accentHsl}, 0 0 40px hsla(${color.h},${color.s}%,${color.l}%,0.3)`,
        }} />
      </section>

      {/* Videos */}
      {dbVideos && dbVideos.length > 0 && (
        <section className={cn(
          "py-16 transition-all duration-700 delay-300",
          loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        )}>
          <div className="container px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 rounded-full" style={{ background: accentHsl }} />
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
                Videos en <span style={{ color: accentGlow }}>vivo</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dbVideos.map((v: any) => {
                const ytId = extractYtId(v.url);
                const title = v.title || "Video";
                return (
                  <div key={v.id} className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl group" style={{
                    boxShadow: `0 4px 24px -8px hsla(${color.h},${color.s}%,${color.l}%,0.1)`
                  }}>
                    <div className="aspect-video relative">
                      {ytId ? (
                        <iframe src={`https://www.youtube.com/embed/${ytId}`} title={title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                      ) : v.url ? (
                        <video src={v.url} controls className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="p-4">
                      <p className="font-body font-semibold text-sm text-white/90">{title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {dbPhotos && dbPhotos.length > 0 && (
        <section className="py-16">
          <div className="container px-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 rounded-full" style={{ background: accentHsl }} />
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
                Galería de <span style={{ color: accentGlow }}>fotos</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dbPhotos.map((p: any) => (
                <div key={p.id} className="rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-500 group">
                  {p.url && (
                    <img src={p.url} alt="" className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About */}
      <section className="py-16">
        <div className="container px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 rounded-full" style={{ background: accentHsl }} />
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
              Sobre el <span style={{ color: accentGlow }}>grupo</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { val: "10+", label: "Años de experiencia" },
              { val: "500+", label: "Eventos realizados" },
              { val: "5.0", label: "Calificación promedio" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl p-6 bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300" style={{
                boxShadow: `0 4px 24px -8px hsla(${color.h},${color.s}%,${color.l}%,0.08)`
              }}>
                <p className="font-display text-3xl font-bold mb-1" style={{ color: accentHsl }}>{item.val}</p>
                <p className="text-white/50 font-body text-sm">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-6 mt-6 bg-white/5 border border-white/10">
            <p className="font-body text-white/70 leading-relaxed">
              {group.description || "Grupo profesional con amplia experiencia en bodas, XV años, eventos empresariales, fiestas privadas y más."}
            </p>
          </div>
        </div>
      </section>

      {/* Sound Packages */}
      {packages.length > 0 && (
        <section className="py-16" id="paquetes">
          <div className="container px-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 rounded-full" style={{ background: accentHsl }} />
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
                Elige tu tipo de <span style={{ color: accentGlow }}>sonido</span>
              </h2>
            </div>
            <p className="text-white/40 font-body mb-8 ml-5">Selecciona el paquete que mejor se adapte a tu evento</p>
            <div className="grid md:grid-cols-3 gap-6">
              {packages.map((p: any) => {
                const isSelected = activePkgId === p.id;
                const features = Array.isArray(p.features) ? p.features : [];
                const hasImage = !!p.image_url;
                return (
                  <button key={p.id} onClick={() => setSelectedPackageId(p.id)}
                    className={cn(
                      "relative overflow-hidden rounded-2xl text-left transition-all duration-300 group",
                      isSelected ? "scale-[1.02] shadow-2xl" : "hover:shadow-xl hover:scale-[1.01]"
                    )}
                    style={{
                      border: isSelected ? `2px solid ${accentHsl}` : "1px solid hsla(0,0%,100%,0.1)",
                      boxShadow: isSelected ? `0 0 30px -5px hsla(${color.h},${color.s}%,${color.l}%,0.3)` : undefined,
                    }}
                  >
                    {hasImage ? (
                      <>
                        <div className="absolute inset-0">
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(25,15%,12%)] via-[hsl(25,15%,9%)] to-[hsl(25,15%,6%)]" />
                        <div className="absolute top-6 right-6 z-[1] opacity-10">
                          <Volume2 className="w-20 h-20 text-white" />
                        </div>
                      </>
                    )}
                    {p.badge && (
                      <span className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg text-white text-xs font-body font-bold shadow-lg" style={{ background: accentHsl }}>
                        {p.badge}
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute top-4 left-4 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-lg" style={{ background: accentHsl }}>
                        <Check className="w-4 h-4 text-white" />
                      </span>
                    )}
                    <div className="relative z-[1] p-6 min-h-[280px] flex flex-col justify-end">
                      <h3 className="font-display font-bold text-xl mb-1 text-white">{p.name}</h3>
                      {p.capacity && (
                        <div className="flex items-center gap-1 font-body text-sm mb-3 text-white/70">
                          <Users className="w-4 h-4" /> {p.capacity}
                        </div>
                      )}
                      <ul className="space-y-1.5 mb-4">
                        {features.slice(0, 4).map((f: string) => (
                          <li key={f} className="flex items-center gap-2 text-sm font-body text-white/80">
                            <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accentHsl }} /> {f}
                          </li>
                        ))}
                        {features.length > 4 && (
                          <li className="text-xs font-body text-white/50">+{features.length - 4} más...</li>
                        )}
                      </ul>
                      <p className="font-body font-bold text-xl" style={{ color: accentGlow }}>
                        {Number(p.price) === 0 ? "Incluido" : `+$${Number(p.price).toLocaleString()} MXN`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Duration + Date + Ticket */}
      <section className="py-16" id="reservar">
        <div className="container px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left - Controls */}
            <div className="space-y-8">
              <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
                <h3 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" style={{ color: accentHsl }} /> Duración del evento
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {hourOptions.map((h) => (
                    <button key={h} onClick={() => setHours(h)}
                      className={cn(
                        "py-3 rounded-xl font-body font-semibold text-center transition-all duration-200",
                        hours === h ? "text-white shadow-md scale-105" : "bg-white/5 border border-white/10 text-white/70 hover:border-white/20"
                      )}
                      style={hours === h ? {
                        background: accentHsl,
                        boxShadow: `0 4px 16px -2px hsla(${color.h},${color.s}%,${color.l}%,0.4)`,
                      } : undefined}
                    >
                      {h} hrs
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
                <h3 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" style={{ color: accentHsl }} /> Fecha y horario
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="font-body text-sm text-white/50 mb-1 block">Fecha del evento</label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-body bg-white/5 border-white/10 text-white hover:bg-white/10", !date && "text-white/40")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(d) => { setDate(d); setCalendarOpen(false); }}
                          disabled={(d) => d < startOfDay(new Date())}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="font-body text-sm text-white/50 mb-1 block">Hora de inicio</label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="font-body bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="font-body text-sm text-white/50 mb-1 block">Dirección del evento</label>
                    <Input placeholder="Ej: Hotel Pueblo Bonito, Zona Dorada" value={address} onChange={(e) => setAddress(e.target.value)} className="font-body bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Ticket */}
            <div>
              {hasPriceConfigured ? (
                <ReservationTicket
                  groupName={group.name}
                  packageName={selectedPkg?.name || "Sin paquete"}
                  hours={hours}
                  date={date}
                  startTime={startTime}
                  total={total}
                  whatsappUrl={whatsappUrl}
                  heroImage={heroImage}
                />
              ) : (
                <div className="rounded-2xl p-8 text-center bg-white/5 border border-white/10">
                  <p className="font-display font-bold text-xl text-white mb-2">Precio no configurado</p>
                  <p className="font-body text-sm text-white/50 mb-4">Este grupo aún no ha configurado sus tarifas.</p>
                  <a href={`https://wa.me/${num}?text=${encodeURIComponent(`Hola, quiero cotizar al grupo ${group.name}`)}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-body font-bold text-sm text-white transition-all hover:scale-[1.03]"
                    style={{ background: accentHsl }}
                  >
                    <MessageCircle className="w-4 h-4" /> Solicitar cotización
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default GroupDetail;
