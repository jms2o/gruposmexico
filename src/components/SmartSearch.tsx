import { useState, useEffect, useRef } from "react";
import { X, Search, MapPin, Music, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SmartSearchProps {
  open: boolean;
  onClose: () => void;
}

const GENRES = [
  "DJ", "Banda Sinaloense", "Norteño", "Grupo Versátil", "Mariachi",
  "Cumbia", "Duranguense", "Reggaetón",
];

const SmartSearch = ({ open, onClose }: SmartSearchProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
    }
  }, [open]);

  // Fetch all visible groups for search
  const { data: allGroups } = useQuery({
    queryKey: ["search-groups"],
    queryFn: async () => {
      const { data } = await supabase
        .from("musical_groups")
        .select("id, name, city, state, badge, category_id, image_url")
        .eq("visible", true)
        .order("sort_order");
      return data || [];
    },
    enabled: open,
  });

  const { data: categories } = useQuery({
    queryKey: ["search-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, title")
        .eq("visible", true);
      return data || [];
    },
    enabled: open,
  });

  const q = query.toLowerCase().trim();

  // Filter groups
  const matchedGroups = q.length >= 2
    ? (allGroups || []).filter((g: any) =>
        g.name?.toLowerCase().includes(q) ||
        g.city?.toLowerCase().includes(q) ||
        g.state?.toLowerCase().includes(q)
      ).slice(0, 8)
    : [];

  // Filter genres
  const matchedGenres = q.length >= 2
    ? GENRES.filter(g => g.toLowerCase().includes(q))
    : [];

  // Filter categories
  const matchedCategories = q.length >= 2
    ? (categories || []).filter((c: any) => c.title?.toLowerCase().includes(q))
    : [];

  // Get unique cities from matched groups
  const matchedCities = q.length >= 2
    ? [...new Set((allGroups || [])
        .filter((g: any) => g.city?.toLowerCase().includes(q))
        .map((g: any) => g.city)
      )].slice(0, 4)
    : [];

  const hasResults = matchedGroups.length > 0 || matchedGenres.length > 0 || matchedCategories.length > 0 || matchedCities.length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={onClose} />

      <div className="relative z-10 flex flex-col h-full">
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border/50">
          <Search className="w-5 h-5 text-gold shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar grupo, ciudad, género..."
            className="flex-1 bg-transparent text-foreground text-lg font-body placeholder:text-muted-foreground outline-none"
          />
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {q.length < 2 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-body">Sugerencias populares</p>
              <div className="flex flex-wrap gap-2">
                {["Mazatlán", "Banda", "Norteño", "Mariachi", "Culiacán", "Versátil"].map(s => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-4 py-2 rounded-full border border-gold/30 text-sm font-body text-gold-light hover:bg-gold/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : !hasResults ? (
            <p className="text-muted-foreground font-body text-center py-8">
              No se encontraron resultados para "{query}"
            </p>
          ) : (
            <div className="space-y-6">
              {/* Cities */}
              {matchedCities.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-body font-bold uppercase tracking-wider mb-2">Ciudades</p>
                  {matchedCities.map((city: string) => {
                    const cityState = (allGroups || []).find((g: any) => g.city === city)?.state;
                    const cityParams = new URLSearchParams();
                    cityParams.set("ciudad", city);
                    if (cityState) cityParams.set("estado", cityState);
                    return (
                      <Link
                        key={city}
                        to={`/todos-los-grupos?${cityParams.toString()}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-gold" />
                        <span className="font-body font-medium text-foreground">{city}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Groups */}
              {matchedGroups.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-body font-bold uppercase tracking-wider mb-2">Grupos</p>
                  {matchedGroups.map((g: any) => (
                    <Link
                      key={g.id}
                      to={`/grupo/${g.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        {g.image_url && <img src={g.image_url} alt={g.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-foreground truncate">{g.name}</p>
                        <p className="text-xs text-muted-foreground font-body">{g.city}{g.state ? `, ${g.state}` : ""}</p>
                      </div>
                      {g.badge && (
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-body font-bold bg-gold/20 text-gold">
                          {g.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* Categories */}
              {matchedCategories.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-body font-bold uppercase tracking-wider mb-2">Categorías</p>
                  {matchedCategories.map((c: any) => (
                    <Link
                      key={c.id}
                      to={`/categoria/${c.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
                    >
                      <Music className="w-4 h-4 text-gold" />
                      <span className="font-body font-medium text-foreground">{c.title}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Genres */}
              {matchedGenres.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-body font-bold uppercase tracking-wider mb-2">Géneros</p>
                  {matchedGenres.map(g => (
                    <button
                      key={g}
                      onClick={() => setQuery(g)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors w-full text-left"
                    >
                      <Users className="w-4 h-4 text-gold" />
                      <span className="font-body font-medium text-foreground">{g}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartSearch;
