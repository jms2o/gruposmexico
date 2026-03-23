import { Link } from "react-router-dom";
import { Star, MessageCircle, Crown } from "lucide-react";
import bandaImg from "@/assets/banda-sinaloense.jpg";
import nortenosImg from "@/assets/nortenos.jpg";
import mariachisImg from "@/assets/mariachis.jpg";
import versatilImg from "@/assets/grupo-versatil.jpg";
import { useVisibleCategories, useWhatsappNumber, useSiteContent } from "@/hooks/useData";

const fallbackImages: Record<string, string> = {
  "Bandas Sinaloenses": bandaImg,
  "Norteños": nortenosImg,
  "Mariachis": mariachisImg,
  "Grupos Versátiles": versatilImg,
};

const CategoriesSection = () => {
  const { data: categories } = useVisibleCategories();
  const { data: whatsappNumber } = useWhatsappNumber();
  const { data: content } = useSiteContent("categories");
  const num = whatsappNumber || "5216691234567";
  const orderedCategories = [...(categories || [])].sort((a: any, b: any) => {
    const aIsDj = String(a.title || "").toLowerCase().includes("dj");
    const bIsDj = String(b.title || "").toLowerCase().includes("dj");
    if (aIsDj && !bIsDj) return -1;
    if (!aIsDj && bIsDj) return 1;
    return (a.sort_order ?? 999) - (b.sort_order ?? 999);
  });

  const get = (key: string, fallback: string) => {
    const item = content?.find((c: any) => c.key === key);
    return item?.value || fallback;
  };

  return (
    <section className="py-24 bg-background" id="categorias">
      <div className="container px-4">
        <h2 className="text-3xl md:text-5xl font-display font-bold text-center mb-3 text-foreground">
          {get("title", "Encuentra tu grupo")} <span className="text-gradient-gold">{get("title_accent", "ideal")}</span>
        </h2>
        <p className="text-center text-muted-foreground mb-4 max-w-lg mx-auto font-body">
          {get("subtitle", "Los mejores grupos musicales listos para tu evento")}
        </p>
        <div className="section-divider mb-14" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {orderedCategories.map((cat: any) => {
            const imgSrc = cat.image_url || fallbackImages[cat.title] || bandaImg;
            return (
              <div
                key={cat.id}
                className="group relative rounded-2xl overflow-hidden gold-border bg-card transition-all duration-500 hover:shadow-[0_0_40px_-8px_hsla(40,65%,50%,0.2)]"
              >
                <Link to={`/categoria/${cat.id}`} className="block">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(30,15%,5%)] via-[hsl(30,15%,5%,0.3)] to-transparent" />
                    
                    {/* Gold ambient light */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                      style={{ background: "radial-gradient(ellipse at center bottom, hsl(40 65% 50%), transparent 70%)" }}
                    />
                  </div>
                </Link>

                <div className="relative z-10 p-5 -mt-16">
                  <Link to={`/categoria/${cat.id}`}>
                    <h3 className="text-2xl font-display font-bold text-white mb-1 drop-shadow-lg">{cat.title}</h3>
                  </Link>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current text-gold" />
                    ))}
                    <span className="text-xs text-white/50 font-body ml-1">5.0</span>
                  </div>
                  <p className="font-body text-gold-light text-base mb-4">
                    Desde <span className="font-bold text-xl">{cat.price}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/categoria/${cat.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-body font-semibold transition-all duration-300 border border-gold/30 bg-gold/10 text-gold-light hover:bg-gold/20 hover:border-gold/50"
                    >
                      VER GRUPOS →
                    </Link>
                    <a
                      href={`https://wa.me/${num}?text=${encodeURIComponent(`Hola, quiero información sobre ${cat.title}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-xl flex items-center justify-center bg-whatsapp text-white hover:bg-whatsapp-hover transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
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

export default CategoriesSection;
