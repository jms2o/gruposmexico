import { useRef } from "react";
import { Link } from "react-router-dom";
import { Flame, Star, Crown, MapPin, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import bandaImg from "@/assets/banda-sinaloense.jpg";
import mariachisImg from "@/assets/mariachis.jpg";
import versatilImg from "@/assets/grupo-versatil.jpg";
import { useFeaturedGroups, useWhatsappNumber, useSiteContent } from "@/hooks/useData";

const fallbackImages = [bandaImg, mariachisImg, versatilImg];

const FeaturedSection = () => {
  const { data: groups } = useFeaturedGroups();
  const { data: whatsappNumber } = useWhatsappNumber();
  const { data: content } = useSiteContent("featured");
  const num = whatsappNumber || "5216691234567";
  const scrollRef = useRef<HTMLDivElement>(null);

  const get = (key: string, fallback: string) => {
    const item = content?.find((c: any) => c.key === key);
    return item?.value || fallback;
  };

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="py-24 bg-muted" id="destacados">
      <div className="container px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-6 h-6 text-gold" />
              <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">
                {get("title", "Más contratados")} <span className="text-gradient-gold">{get("title_accent", "esta semana")}</span>
              </h2>
            </div>
            <p className="text-muted-foreground font-body">
              {get("subtitle", "Los favoritos de nuestros clientes")}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => scroll("left")} className="w-10 h-10 rounded-full border border-gold/30 bg-card flex items-center justify-center text-gold-light hover:bg-gold/10 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => scroll("right")} className="w-10 h-10 rounded-full border border-gold/30 bg-card flex items-center justify-center text-gold-light hover:bg-gold/10 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="section-divider mb-10" />

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
        >
          {(groups || []).map((group: any, idx: number) => {
            const imgSrc = group.image_url || fallbackImages[idx % fallbackImages.length];
            return (
              <div
                key={group.id}
                className="snap-start shrink-0 w-[280px] sm:w-[300px] rounded-2xl overflow-hidden gold-border bg-card group transition-all duration-300 hover:shadow-[0_0_40px_-8px_hsla(40,65%,50%,0.2)]"
              >
                <Link to={`/grupo/${group.id}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={imgSrc} alt={group.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(30,15%,5%,0.7)] via-transparent to-transparent" />
                    {group.badge && (
                      <span className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded-full text-xs font-body font-bold bg-gradient-gold text-[hsl(30,15%,5%)] shadow-lg flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        {group.badge}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/grupo/${group.id}`}>
                    <h3 className="text-lg font-display font-bold text-foreground mb-1 truncate">{group.name}</h3>
                  </Link>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm font-body font-semibold text-gold">5.0</span>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current text-gold" />
                    ))}
                  </div>
                  {(group.city || group.state) && (
                    <p className="text-xs text-muted-foreground font-body flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" /> {group.city}{group.state ? `, ${group.state}` : ""}
                    </p>
                  )}
                  <p className="text-muted-foreground font-body text-sm mb-3">
                    Desde <span className="text-gold font-bold text-lg">{group.price}</span> /evento
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/grupo/${group.id}`}
                      className="flex-1 inline-flex items-center justify-center py-2.5 rounded-xl border border-gold/30 bg-gold/10 text-gold-light text-sm font-body font-semibold hover:bg-gold/20 hover:border-gold/50 transition-all"
                    >
                      VER PERFIL
                    </Link>
                    <a
                      href={`https://wa.me/${num}?text=${encodeURIComponent(`Hola, quiero reservar a ${group.name} para mi evento.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-whatsapp flex items-center justify-center text-white hover:bg-whatsapp-hover transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
