import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, Award } from "lucide-react";
import bandaImg from "@/assets/banda-sinaloense.jpg";
import mariachisImg from "@/assets/mariachis.jpg";
import versatilImg from "@/assets/grupo-versatil.jpg";

const fallbackImages = [bandaImg, mariachisImg, versatilImg];

interface DestacadosSectionProps {
  groups: any[];
  whatsappNum: string;
  cityName: string;
}

const DestacadosSection = ({ groups, whatsappNum, cityName }: DestacadosSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (!groups.length) return null;

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-gold" />
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
            Grupos <span className="text-gold">Destacados</span>
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => scroll("left")} className="w-9 h-9 rounded-full border border-gold/30 bg-card flex items-center justify-center text-gold-light hover:bg-gold/10 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll("right")} className="w-9 h-9 rounded-full border border-gold/30 bg-card flex items-center justify-center text-gold-light hover:bg-gold/10 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
      >
        {groups.map((group: any, idx: number) => {
          const imgSrc = group.image_url || fallbackImages[idx % fallbackImages.length];
          return (
            <div
              key={group.id}
              className="snap-start shrink-0 w-[44vw] sm:w-[300px] md:w-[320px] relative rounded-2xl overflow-hidden bg-card gold-card-frame transition-all duration-300 hover:scale-[1.02]"
            >
              {/* DESTACADO badge */}
              <div className="absolute top-3 left-3 z-20">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-bold bg-gradient-gold text-[hsl(30,15%,5%)] shadow-lg">
                  <Star className="w-3 h-3" />
                  DESTACADO
                </span>
              </div>

              <Link to={`/grupo/${group.id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img src={imgSrc} alt={group.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(30,15%,5%)] via-[hsl(30,15%,5%,0.3)] to-transparent" />
                </div>
              </Link>

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <Link to={`/grupo/${group.id}`}>
                  <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white drop-shadow-lg mb-1">{group.name}</h3>
                </Link>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-sm font-body font-bold text-gold">5.0</span>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current text-gold" />
                  ))}
                </div>
                <p className="text-white/80 font-body text-sm mb-3">
                  Desde <span className="text-gold font-extrabold text-xl">{group.price}</span>
                  <span className="text-gold-light text-xs"> MXN/hr</span>
                  <span className="text-white/50 text-xs"> /evento</span>
                </p>
                <Link
                  to={`/grupo/${group.id}`}
                  className="w-full inline-flex items-center justify-center py-3 rounded-xl border-2 border-gold/50 text-gold font-body font-bold text-sm hover:bg-gold/10 transition-all uppercase tracking-wider"
                >
                  VER PERFIL
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DestacadosSection;
