import { useParams, Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { ChevronRight, Star, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { useWhatsappNumber } from "@/hooks/useData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { stripEmojisDeep } from "@/lib/text";

import bandaImg from "@/assets/banda-sinaloense.jpg";
import mariachisImg from "@/assets/mariachis.jpg";
import versatilImg from "@/assets/grupo-versatil.jpg";

const fallbackImages = [bandaImg, mariachisImg, versatilImg];

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: whatsappNumber } = useWhatsappNumber();
  const [searchParams] = useSearchParams();
  const estado = searchParams.get("estado");
  const ciudad = searchParams.get("ciudad");

  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  const num = whatsappNumber || "5216691234567";

  const { data: category } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
      return stripEmojisDeep(data);
    },
    enabled: !!id,
  });

  const { data: groups } = useQuery({
    queryKey: ["category-groups", id, estado, ciudad],
    queryFn: async () => {
      if (!id) return [];
      let query = supabase
        .from("musical_groups")
        .select("*")
        .eq("category_id", id)
        .eq("visible", true)
        .order("sort_order");
      if (estado) query = query.eq("state", estado);
      if (ciudad) query = query.eq("city", ciudad);
      const { data } = await query;
      return stripEmojisDeep(data || []);
    },
    enabled: !!id,
  });

  const locationLabel = ciudad && estado ? `en ${ciudad}, ${estado}` : estado ? `en ${estado}` : "";

  return (
    <>
      <Navbar />
      <div className="pt-20 bg-background">
        <div className="container px-4 py-4">
          <nav className="flex items-center gap-1.5 text-sm font-body text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-semibold">{category?.title || "Categoría"} {locationLabel}</span>
          </nav>
        </div>
      </div>

      <section className="py-12 bg-background">
        <div className="container px-4">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-2">
            {category?.title || "Categoría"} {locationLabel}
          </h1>
          <p className="text-muted-foreground font-body">
            {category?.price ? `Desde ${category.price}` : "Los mejores grupos para tu evento"}
          </p>
          <div className="section-divider mt-4" />
        </div>
      </section>

      <section className="py-12 bg-muted min-h-[40vh]">
        <div className="container px-4">
          {!groups?.length ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-body text-lg">No hay grupos en esta categoría {locationLabel}.</p>
              <Link to="/" className="inline-flex mt-4 btn-whatsapp px-6 py-3 text-sm">Volver al inicio</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {groups.map((group: any, idx: number) => (
                <Link to={`/grupo/${group.id}`} key={group.id} className="card-premium overflow-hidden relative group block">
                  {group.badge && (
                    <span className={`absolute top-4 left-4 z-10 px-4 py-1.5 rounded-full text-xs font-body font-bold shadow-lg ${group.badge_color || "bg-gold text-accent-foreground"}`}>
                      {group.badge}
                    </span>
                  )}
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={group.image_url || fallbackImages[idx % fallbackImages.length]}
                      alt={group.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                      ))}
                      <span className="text-xs text-muted-foreground font-body ml-1">5.0</span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-foreground mb-2">{group.name}</h3>
                    <p className="text-gold font-body font-bold text-2xl mb-5">{group.price}</p>
                    <span className="w-full btn-whatsapp py-3.5 text-base">
                      <MessageCircle className="w-4 h-4" /> Ver detalles
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
};

export default CategoryPage;
