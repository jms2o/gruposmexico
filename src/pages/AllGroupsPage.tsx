import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, MessageCircle, Star, MapPin, Crown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { useWhatsappNumber, useVisibleCategories } from "@/hooks/useData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { stripEmojis, stripEmojisDeep } from "@/lib/text";

import bandaImg from "@/assets/banda-sinaloense.jpg";
import mariachisImg from "@/assets/mariachis.jpg";
import versatilImg from "@/assets/grupo-versatil.jpg";

const fallbackImages = [bandaImg, mariachisImg, versatilImg];

const AllGroupsPage = () => {
  const { data: whatsappNumber } = useWhatsappNumber();
  const { data: categories } = useVisibleCategories();
  const num = whatsappNumber || "5216691234567";
  const [searchParams, setSearchParams] = useSearchParams();
  const estado = searchParams.get("estado");
  const ciudad = searchParams.get("ciudad");
  const selectedCategory = searchParams.get("categoria");

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const setSelectedCategory = (categoryId: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (categoryId) next.set("categoria", categoryId);
    else next.delete("categoria");
    setSearchParams(next);
  };

  const { data: groups } = useQuery({
    queryKey: ["all-active-groups", selectedCategory, estado, ciudad],
    queryFn: async () => {
      let query = supabase
        .from("musical_groups")
        .select("*, categories(title)")
        .eq("visible", true)
        .order("sort_order");
      if (selectedCategory) query = query.eq("category_id", selectedCategory);
      if (estado) query = query.eq("state", estado);
      if (ciudad) query = query.eq("city", ciudad);
      const { data } = await query;
      return stripEmojisDeep(data || []);
    },
  });

  const selectedTitle = selectedCategory
    ? stripEmojis(categories?.find((c: any) => c.id === selectedCategory)?.title || "")
    : null;
  const orderedCategories = [...(categories || [])].sort((a: any, b: any) => {
    const aIsDj = String(a.title || "").toLowerCase().includes("dj");
    const bIsDj = String(b.title || "").toLowerCase().includes("dj");
    if (aIsDj && !bIsDj) return -1;
    if (!aIsDj && bIsDj) return 1;
    return (a.sort_order ?? 999) - (b.sort_order ?? 999);
  });
  const locationLabel = ciudad && estado ? `${ciudad}, ${estado}` : estado ? estado : "";

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[hsl(30,15%,5%)]">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full bg-[hsla(40,65%,50%,0.06)] blur-[100px]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>

        <div className="relative z-10 pt-28 pb-10 px-4">
          <div className="container">
            <nav className="flex items-center gap-1.5 text-sm font-body text-white/50 mb-6">
              <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to="/todos-los-grupos" className="hover:text-white transition-colors">Todos los grupos</Link>
              {ciudad && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-gold-light font-semibold">{ciudad}</span>
                </>
              )}
              {selectedTitle && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-gold-light font-semibold">{selectedTitle}</span>
                </>
              )}
            </nav>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-white mb-3">
              {selectedTitle || `Todos los grupos`} {locationLabel && <span className="text-gradient-gold">de {locationLabel}</span>}
            </h1>
            <p className="text-white/60 font-body text-base sm:text-lg mb-6">
              Explora {selectedTitle ? `nuestras ${selectedTitle.toLowerCase()} disponibles` : "todos los grupos musicales disponibles"} {locationLabel ? `de ${locationLabel}` : ""}.
            </p>

            {/* Category filter pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-5 py-2.5 rounded-full text-sm font-body font-semibold transition-all duration-200 ${
                  !selectedCategory ? "bg-gradient-gold text-[hsl(30,15%,5%)] shadow-lg" : "border border-gold/30 bg-gold/5 text-gold-light hover:bg-gold/15"
                }`}
              >
                Todos
              </button>
              {orderedCategories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-body font-semibold transition-all duration-200 ${
                    selectedCategory === cat.id ? "bg-gradient-gold text-[hsl(30,15%,5%)] shadow-lg" : "border border-gold/30 bg-gold/5 text-gold-light hover:bg-gold/15"
                  }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Groups grid */}
      <section className="py-10 bg-background min-h-[40vh]">
        <div className="container px-4">
          {!groups?.length ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-body text-lg">No hay grupos disponibles {locationLabel}.</p>
              <Link to="/todos-los-grupos" className="inline-flex mt-4 btn-gold px-6 py-3 text-sm">Ver todos los grupos</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group: any, idx: number) => {
                const imgSrc = group.image_url || fallbackImages[idx % fallbackImages.length];
                const detailParams = new URLSearchParams();
                if (estado) detailParams.set("estado", estado);
                if (ciudad) detailParams.set("ciudad", ciudad);
                if (selectedCategory) detailParams.set("categoria", selectedCategory);
                const detailLink = `/grupo/${group.id}${detailParams.toString() ? `?${detailParams.toString()}` : ""}`;
                return (
                  <div key={group.id} className="rounded-2xl overflow-hidden gold-border bg-card group transition-all duration-300 hover:shadow-[0_0_40px_-8px_hsla(40,65%,50%,0.2)]">
                    <Link to={detailLink} className="block">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img src={imgSrc} alt={group.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(30,15%,5%,0.7)] via-transparent to-transparent" />
                        {group.badge && (
                          <span className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded-full text-xs font-body font-bold bg-gradient-gold text-[hsl(30,15%,5%)] shadow-lg flex items-center gap-1">
                            <Crown className="w-3 h-3" /> {group.badge}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link to={detailLink}>
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
                        <Link to={detailLink} className="flex-1 inline-flex items-center justify-center py-2.5 rounded-xl border border-gold/30 bg-gold/10 text-gold-light text-sm font-body font-semibold hover:bg-gold/20 hover:border-gold/50 transition-all">
                          VER PERFIL
                        </Link>
                        <a
                          href={`https://wa.me/${num}?text=${encodeURIComponent(`Hola, quiero información sobre ${group.name} para mi evento.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
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
          )}
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
};

export default AllGroupsPage;
