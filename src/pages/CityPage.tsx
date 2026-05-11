import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { ChevronRight, Crown, Star, MapPin, Music, Flame } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { useWhatsappNumber } from "@/hooks/useData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TopRankingSection from "@/components/city/TopRankingSection";
import DestacadosSection from "@/components/city/DestacadosSection";
import MoreGroupsSection from "@/components/city/MoreGroupsSection";

const CITY_SLUG_MAP: Record<string, { name: string; estado: string }> = {
  mazatlan: { name: "Mazatlán", estado: "Sinaloa" },
  culiacan: { name: "Culiacán", estado: "Sinaloa" },
  "los-mochis": { name: "Los Mochis", estado: "Sinaloa" },
  guasave: { name: "Guasave", estado: "Sinaloa" },
  navolato: { name: "Navolato", estado: "Sinaloa" },
  guadalajara: { name: "Guadalajara", estado: "Jalisco" },
  zapopan: { name: "Zapopan", estado: "Jalisco" },
  "puerto-vallarta": { name: "Puerto Vallarta", estado: "Jalisco" },
  monterrey: { name: "Monterrey", estado: "Nuevo León" },
  "ciudad-de-mexico": { name: "Ciudad de México", estado: "CDMX" },
  hermosillo: { name: "Hermosillo", estado: "Sonora" },
  tijuana: { name: "Tijuana", estado: "Baja California" },
  durango: { name: "Durango", estado: "Durango" },
  chihuahua: { name: "Chihuahua", estado: "Chihuahua" },
  leon: { name: "León", estado: "Guanajuato" },
  morelia: { name: "Morelia", estado: "Michoacán" },
  acapulco: { name: "Acapulco", estado: "Guerrero" },
  puebla: { name: "Puebla", estado: "Puebla" },
  veracruz: { name: "Veracruz", estado: "Veracruz" },
  toluca: { name: "Toluca", estado: "Estado de México" },
  tepic: { name: "Tepic", estado: "Nayarit" },
  saltillo: { name: "Saltillo", estado: "Coahuila" },
  torreon: { name: "Torreón", estado: "Coahuila" },
  reynosa: { name: "Reynosa", estado: "Tamaulipas" },
  tampico: { name: "Tampico", estado: "Tamaulipas" },
  "san-luis-potosi": { name: "San Luis Potosí", estado: "San Luis Potosí" },
  aguascalientes: { name: "Aguascalientes", estado: "Aguascalientes" },
  zacatecas: { name: "Zacatecas", estado: "Zacatecas" },
  "gomez-palacio": { name: "Gómez Palacio", estado: "Durango" },
  "ciudad-obregon": { name: "Ciudad Obregón", estado: "Sonora" },
  escuinapa: { name: "Escuinapa", estado: "Sinaloa" },
  concordia: { name: "Concordia", estado: "Sinaloa" },
  "el-rosario": { name: "El Rosario", estado: "Sinaloa" },
};

const CityPage = () => {
  const { ciudad: slugParam } = useParams<{ ciudad: string }>();
  const { data: whatsappNumber } = useWhatsappNumber();
  const num = whatsappNumber || "5216691234567";

  const cityInfo = slugParam ? CITY_SLUG_MAP[slugParam] : null;
  const cityName = cityInfo?.name || slugParam || "";
  const estadoName = cityInfo?.estado || "";

  useEffect(() => { window.scrollTo(0, 0); }, [slugParam]);

  const { data: allGroups } = useQuery({
    queryKey: ["city-groups", cityName],
    queryFn: async () => {
      if (!cityName) return [];
      const { data } = await supabase
        .from("musical_groups")
        .select("*")
        .eq("city", cityName)
        .eq("visible", true)
        .order("sort_order");
      return data || [];
    },
    enabled: !!cityName,
  });

  // Section 1: Top 10 by sort_order (best ranking)
  const topGroups = (allGroups || []).slice(0, 10);

  // Section 2: Destacados (badge DESTACADO or PREMIUM, excluding top 3)
  const topIds = new Set(topGroups.map((g: any) => g.id));
  const destacados = (allGroups || []).filter(
    (g: any) => !topIds.has(g.id) && (g.featured || (g.badge && ["PREMIUM", "DESTACADO", "MÁS CONTRATADA"].includes(g.badge)))
  );

  // Section 3: All remaining
  const destacadoIds = new Set(destacados.map((g: any) => g.id));
  const basicGroups = (allGroups || []).filter(
    (g: any) => !topIds.has(g.id) && !destacadoIds.has(g.id)
  );

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[hsl(30,15%,5%)]">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[hsla(40,65%,50%,0.06)] blur-[100px]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        </div>

        <div className="relative z-10 pt-28 pb-12 px-4 text-center">
          <nav className="flex items-center justify-center gap-1.5 text-sm font-body text-white/50 mb-6">
            <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/60">Grupos</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gold-light font-semibold">{cityName}</span>
          </nav>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-white mb-3">
            GRUPOS EN{" "}
            <span className="text-gradient-gold" style={{ filter: "drop-shadow(0 0 20px hsla(40,65%,50%,0.3))" }}>
              {cityName.toUpperCase()}
            </span>
          </h1>
          <p className="text-white/60 font-body text-base sm:text-lg">
            Los mejores grupos disponibles para tu evento
          </p>
          <div className="section-divider mt-5" />
        </div>
      </section>

      {/* Content */}
      <section className="py-10 bg-background min-h-[50vh]">
        <div className="max-w-[1400px] mx-auto px-4">
          {!allGroups?.length ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-body text-lg">No hay grupos registrados en {cityName} aún.</p>
              <Link to="/" className="inline-flex mt-4 btn-gold px-6 py-3 text-sm">Volver al inicio</Link>
            </div>
          ) : (
            <>
              {/* Section 1: Top Ranking */}
              <TopRankingSection groups={topGroups} cityName={cityName} whatsappNum={num} />

              {/* CTA: Publicar solicitud */}
              <div className="flex justify-center my-8">
                <Link
                  to="/solicitar-evento"
                  className="btn-gold px-8 py-3.5 text-base rounded-full flex items-center gap-2"
                >
                  <span></span> Publicar solicitud de grupo <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Section 2: Destacados */}
              {destacados.length > 0 && (
                <DestacadosSection groups={destacados} whatsappNum={num} cityName={cityName} />
              )}

              {/* Section 3: More groups */}
              {basicGroups.length > 0 && (
                <MoreGroupsSection groups={basicGroups} whatsappNum={num} cityName={cityName} />
              )}

              {/* CTA Banner */}
              <div className="mt-8 mb-4 rounded-2xl gold-border bg-gradient-to-r from-[hsla(40,65%,50%,0.05)] via-[hsla(40,65%,50%,0.1)] to-[hsla(40,65%,50%,0.05)] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                    ¿TU GRUPO QUIERE APARECER AQUÍ?
                  </h3>
                  <p className="text-muted-foreground font-body text-sm mt-1">
                    Obtén más contrataciones · <span className="text-gold">Posición premium</span>
                  </p>
                </div>
                <Link to="/membresias" className="btn-gold px-8 py-3 text-base shrink-0">
                  VER PLANES
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
      <WhatsAppFloat />
    </>
  );
};

export default CityPage;
