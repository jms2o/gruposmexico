import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MapPin, Users, Calendar } from "lucide-react";
import { useFeaturedGroups, useWhatsappNumber, useSiteContent, useVisibleCategories } from "@/hooks/useData";
import goldenMic from "@/assets/golden-mic-logo.png";

const ESTADOS_CIUDADES: Record<string, string[]> = {
  "Sinaloa": ["Mazatlán", "Culiacán", "Los Mochis", "Guasave", "Navolato", "El Rosario", "Escuinapa", "Concordia"],
  "Jalisco": ["Guadalajara", "Zapopan", "Tlaquepaque", "Puerto Vallarta", "Tonalá", "Tlajomulco"],
  "CDMX": ["Ciudad de México"],
  "Nuevo León": ["Monterrey", "San Pedro", "San Nicolás", "Apodaca", "Guadalupe", "Escobedo"],
  "Sonora": ["Hermosillo", "Ciudad Obregón", "Nogales", "Guaymas", "Navojoa"],
  "Durango": ["Durango", "Gómez Palacio", "Lerdo"],
  "Chihuahua": ["Chihuahua", "Ciudad Juárez", "Delicias", "Cuauhtémoc", "Parral"],
  "Guanajuato": ["León", "Irapuato", "Celaya", "Salamanca", "Guanajuato"],
  "Michoacán": ["Morelia", "Uruapan", "Zamora", "Lázaro Cárdenas", "Apatzingán"],
  "Baja California": ["Tijuana", "Mexicali", "Ensenada", "Rosarito", "Tecate"],
  "Guerrero": ["Acapulco", "Chilpancingo", "Zihuatanejo", "Taxco", "Iguala"],
  "Nayarit": ["Tepic", "Bahía de Banderas", "Compostela", "Santiago Ixcuintla"],
  "Zacatecas": ["Zacatecas", "Fresnillo", "Guadalupe", "Jerez"],
  "Aguascalientes": ["Aguascalientes", "Jesús María", "Calvillo"],
  "Tamaulipas": ["Reynosa", "Tampico", "Matamoros", "Nuevo Laredo", "Victoria"],
  "Coahuila": ["Saltillo", "Torreón", "Monclova", "Piedras Negras"],
  "San Luis Potosí": ["San Luis Potosí", "Ciudad Valles", "Soledad de Graciano"],
  "Puebla": ["Puebla", "Tehuacán", "Atlixco", "San Martín Texmelucan"],
  "Veracruz": ["Veracruz", "Xalapa", "Coatzacoalcos", "Córdoba", "Boca del Río"],
  "Estado de México": ["Toluca", "Ecatepec", "Naucalpan", "Tlalnepantla", "Metepec"],
};

const ESTADOS = Object.keys(ESTADOS_CIUDADES);

const stats = [
  { icon: Users, value: "+500", label: "Grupos Registrados" },
  { icon: MapPin, value: "+20", label: "Estados" },
  { icon: Calendar, value: "+1,000", label: "Eventos Contratados" },
];

// Gold particle component
const GoldParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; decay: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = () => {
      if (particles.length < 40) {
        particles.push({
          x: Math.random() * canvas.offsetWidth,
          y: canvas.offsetHeight + 10,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(Math.random() * 0.4 + 0.15),
          size: Math.random() * 2.5 + 0.5,
          alpha: Math.random() * 0.5 + 0.2,
          decay: Math.random() * 0.001 + 0.0005,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
         ctx.beginPath();
         ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
         ctx.fillStyle = `hsla(45, 100%, 50%, ${p.alpha})`;
         ctx.fill();
         // glow
         ctx.beginPath();
         ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
         ctx.fillStyle = `hsla(45, 100%, 50%, ${p.alpha * 0.15})`;
         ctx.fill();
      }
      spawn();
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

const HeroSection = () => {
  const { data: categories } = useVisibleCategories();
  const { data: content } = useSiteContent("hero");
  const [selectedEstado, setSelectedEstado] = useState("Sinaloa");
  const [selectedCiudad, setSelectedCiudad] = useState("Mazatlán");
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);
  const [showCiudadDropdown, setShowCiudadDropdown] = useState(false);

  const ciudades = ESTADOS_CIUDADES[selectedEstado] || [];

  // Reset city when state changes
  useEffect(() => {
    const cities = ESTADOS_CIUDADES[selectedEstado];
    if (cities && cities.length > 0) {
      setSelectedCiudad(cities[0]);
    }
  }, [selectedEstado]);

  const get = (key: string, fallback: string) => {
    const item = content?.find((c: any) => c.key === key);
    return item?.value || fallback;
  };

  const orderedCategories = [...(categories || [])].sort((a: any, b: any) => {
    const aIsDj = String(a.title || "").toLowerCase().includes("dj");
    const bIsDj = String(b.title || "").toLowerCase().includes("dj");
    if (aIsDj && !bIsDj) return -1;
    if (!aIsDj && bIsDj) return 1;
    return (a.sort_order ?? 999) - (b.sort_order ?? 999);
  });

  return (
    <section className="relative bg-background overflow-hidden">
      <div className="relative min-h-[100svh] flex flex-col">
        {/* Dark background with neon gradients */}
        <div className="absolute inset-0 bg-[hsl(3,8%,6%)]">
          {/* Neon gold glow behind title */}
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-[hsla(45,100%,50%,0.12)] blur-[120px]" />
          {/* Neon purple secondary glow */}
          <div className="absolute top-[20%] left-1/4 w-[400px] h-[400px] rounded-full bg-[hsla(280,100%,44%,0.08)] blur-[100px]" />
          {/* Gold tertiary glow */}
          <div className="absolute top-[25%] right-1/4 w-[350px] h-[350px] rounded-full bg-[hsla(45,100%,50%,0.08)] blur-[90px]" />
          {/* Bottom fade to background */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
          {/* Neon shimmer line */}
          <div className="absolute top-[48%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsla(45,100%,50%,0.35)] to-transparent" />
        </div>

        {/* Animated gold particles */}
        <GoldParticles />

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-20 pb-8 px-4 text-center">
          {/* Golden Microphone Logo + Brand Name */}
          <div className="mb-6 relative flex flex-col items-center">
             {/* Glow behind mic */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full bg-[hsla(45,100%,50%,0.15)] blur-[80px]" />
             <img
               src={goldenMic}
               alt="GruposMéxico.com"
               className="relative w-28 sm:w-36 md:w-44 object-contain drop-shadow-[0_0_60px_hsla(45,100%,50%,0.7)] mb-4"
             />
             {/* Brand text rendered natively */}
             <h1 className="relative font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none">
               <span className="bg-gradient-to-b from-[hsl(45,100%,65%)] via-[hsl(45,100%,50%)] to-[hsl(45,85%,40%)] bg-clip-text text-transparent drop-shadow-[0_2px_20px_hsla(45,100%,50%,0.5)]">
                 GRUPOS
               </span>
               <span className="bg-gradient-to-b from-[hsl(45,100%,65%)] via-[hsl(45,100%,50%)] to-[hsl(45,85%,40%)] bg-clip-text text-transparent mx-0.5">
                 ×
               </span>
               <span className="bg-gradient-to-b from-[hsl(45,100%,65%)] via-[hsl(45,100%,50%)] to-[hsl(45,85%,40%)] bg-clip-text text-transparent drop-shadow-[0_2px_20px_hsla(45,100%,50%,0.5)]">
                 MÉXICO
               </span>
               <span className="bg-gradient-to-b from-[hsl(45,100%,60%)] to-[hsl(45,85%,40%)] bg-clip-text text-transparent text-xl sm:text-2xl md:text-3xl align-baseline ml-1">.COM</span>
             </h1>
             {/* Subtle gold line under brand */}
             <div className="mt-3 h-px w-40 sm:w-56 bg-gradient-to-r from-transparent via-[hsla(45,100%,50%,0.5)] to-transparent" />
          </div>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto font-body leading-relaxed mb-8">
            {get("subtitle", "Descubre y contrata bandas, norteños, sierreños y mariachis de todo México para tu evento.")}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-5 mb-10">
             {stats.map((stat) => (
               <div
                 key={stat.label}
                 className="flex flex-col items-center justify-center px-5 py-4 sm:px-8 sm:py-5 rounded-2xl gold-card-frame-subtle bg-[hsla(3,8%,10%,0.6)] backdrop-blur-md min-w-[140px] sm:min-w-[170px] border border-neon-gold/25 neon-glow-gold"
               >
                 <p className="text-3xl sm:text-4xl font-display font-bold text-neon-gold leading-none">
                   {stat.value}
                 </p>
                 <p className="text-xs sm:text-sm text-white/60 font-body mt-1.5">
                   {stat.label}
                 </p>
               </div>
             ))}
          </div>

          {/* State + City Selector */}
          <div className="w-full max-w-lg mx-auto">
            <p className="text-white/80 font-body font-semibold text-base sm:text-lg mb-4">
              Encuentra grupos en tu estado
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
               {/* Estado selector */}
               <div className="relative">
                 <button
                   onClick={() => { setShowEstadoDropdown(!showEstadoDropdown); setShowCiudadDropdown(false); }}
                   className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-neon-gold/40 bg-[hsla(3,8%,10%,0.7)] backdrop-blur-md text-neon-gold font-body font-semibold text-base hover:border-neon-gold/70 hover:neon-glow-gold transition-all duration-300"
                 >
                   <span className="flex items-center gap-2">
                     <MapPin className="w-4 h-4 text-neon-gold/70" />
                     {selectedEstado}
                   </span>
                   <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showEstadoDropdown ? "rotate-180" : ""}`} />
                 </button>
                 {showEstadoDropdown && (
                   <div className="absolute top-full mt-2 left-0 right-0 max-h-60 overflow-y-auto rounded-2xl border border-neon-gold/20 bg-[hsla(3,8%,8%,0.95)] backdrop-blur-xl z-30 shadow-2xl">
                     {ESTADOS.map((estado) => (
                       <button
                         key={estado}
                         onClick={() => { setSelectedEstado(estado); setShowEstadoDropdown(false); }}
                         className={`w-full text-left px-5 py-3 font-body text-sm transition-colors ${
                           estado === selectedEstado
                             ? "text-neon-gold bg-neon-gold/15"
                             : "text-white/70 hover:text-neon-gold hover:bg-neon-gold/10"
                         }`}
                       >
                         {estado}
                       </button>
                     ))}
                   </div>
                 )}
               </div>

               {/* Ciudad selector */}
               <div className="relative">
                 <button
                   onClick={() => { setShowCiudadDropdown(!showCiudadDropdown); setShowEstadoDropdown(false); }}
                    className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-neon-gold/40 bg-[hsla(3,8%,10%,0.7)] backdrop-blur-md text-neon-gold font-body font-semibold text-base hover:border-neon-gold/70 hover:neon-glow-gold transition-all duration-300"
                 >
                   <span className="flex items-center gap-2">
                     <MapPin className="w-4 h-4 text-neon-gold/70" />
                     {selectedCiudad}
                   </span>
                   <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCiudadDropdown ? "rotate-180" : ""}`} />
                 </button>
                 {showCiudadDropdown && (
                   <div className="absolute top-full mt-2 left-0 right-0 max-h-60 overflow-y-auto rounded-2xl border border-neon-gold/20 bg-[hsla(3,8%,8%,0.95)] backdrop-blur-xl z-30 shadow-2xl">
                     {ciudades.map((ciudad) => (
                       <button
                         key={ciudad}
                         onClick={() => { setSelectedCiudad(ciudad); setShowCiudadDropdown(false); }}
                          className={`w-full text-left px-5 py-3 font-body text-sm transition-colors ${
                            ciudad === selectedCiudad
                              ? "text-neon-gold bg-neon-gold/15"
                              : "text-white/70 hover:text-neon-gold hover:bg-neon-gold/10"
                         }`}
                       >
                         {ciudad}
                       </button>
                     ))}
                   </div>
                 )}
               </div>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {[
                { label: `Todos los grupos de ${selectedCiudad}`, id: null as string | null },
                ...orderedCategories.map((cat: any) => ({ label: cat.title, id: cat.id as string })),
              ].map((cat) => {
                const base = `/todos-los-grupos?estado=${encodeURIComponent(selectedEstado)}&ciudad=${encodeURIComponent(selectedCiudad)}`;
                const linkTo = cat.id ? `${base}&categoria=${encodeURIComponent(cat.id)}` : base;
                return (
                   <Link
                     key={cat.id || "todos"}
                     to={linkTo}
                     className="px-5 py-2.5 rounded-full border border-gold/30 bg-gold/5 backdrop-blur-sm text-gold text-sm font-body font-medium hover:border-gold/60 hover:bg-gold/15 hover:text-gold transition-all duration-300 neon-glow-gold"
                   >
                     {cat.label}
                   </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Spark animation */}
      <style>{`
        @keyframes spark-rise {
          0% { opacity: 0; transform: translateY(0) scale(1); }
          10% { opacity: var(--max-opacity, 0.5); }
          50% { opacity: var(--max-opacity, 0.5); transform: translateY(-40px) scale(0.8); }
          100% { opacity: 0; transform: translateY(-80px) scale(0.3); }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
