import { useEffect, useRef, useState } from "react";
import { Search, Loader2, MapPin, Navigation, X, ChevronLeft, CornerDownLeft } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { ESTADOS_CIUDADES, ESTADOS } from "@/lib/locationData";

// Fix default marker icon
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const goldIcon = new L.DivIcon({
  html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#d4a843,#f5d67b);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(212,168,67,0.5);border:3px solid rgba(255,255,255,0.3);">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

interface GeoSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface EventLocationMapProps {
  state: string;
  city: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  onAddressChange: (address: string) => void;
  onCoordinatesChange?: (lat: number | null, lng: number | null) => void;
}

const DEFAULT_LAT = 23.2494;
const DEFAULT_LNG = -106.4174;

// Dark tiles like Uber
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

const EventLocationMap = ({
  state, city, address, latitude, longitude, onStateChange, onCityChange, onAddressChange, onCoordinatesChange
}: EventLocationMapProps) => {
  const [view, setView] = useState<"preview" | "search" | "map">("preview");
  const fullMapRef = useRef<HTMLDivElement>(null);
  const previewMapRef = useRef<HTMLDivElement>(null);
  const fullMapInstanceRef = useRef<L.Map | null>(null);
  const previewMapInstanceRef = useRef<L.Map | null>(null);
  const fullMarkerRef = useRef<L.Marker | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [addressQuery, setAddressQuery] = useState(address || "");
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [selectedCoords, setSelectedCoords] = useState<[number, number]>([
    typeof latitude === "number" ? latitude : DEFAULT_LAT,
    typeof longitude === "number" ? longitude : DEFAULT_LNG,
  ]);
  const [locatingUser, setLocatingUser] = useState(false);

  const cities = state ? ESTADOS_CIUDADES[state] || [] : [];

  useEffect(() => {
    if (typeof latitude === "number" && typeof longitude === "number") {
      setSelectedCoords([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Initialize preview map (static, no interaction)
  useEffect(() => {
    if (!previewMapRef.current || previewMapInstanceRef.current) return;

    const previewMapOptions: L.MapOptions & { tap: boolean } = {
      center: selectedCoords,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
    };

    const map = L.map(previewMapRef.current, previewMapOptions);

    L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map);
    L.marker(selectedCoords, { icon: goldIcon, interactive: false }).addTo(map);

    previewMapInstanceRef.current = map;

    return () => {
      map.remove();
      previewMapInstanceRef.current = null;
    };
  }, []);

  // Update preview map when coords change
  useEffect(() => {
    if (previewMapInstanceRef.current) {
      previewMapInstanceRef.current.setView(selectedCoords, 14, { animate: false });
      previewMapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) previewMapInstanceRef.current!.removeLayer(layer);
      });
      L.marker(selectedCoords, { icon: goldIcon, interactive: false }).addTo(previewMapInstanceRef.current);
    }
  }, [selectedCoords]);

  // Initialize fullscreen map
  useEffect(() => {
    if (view !== "map") {
      if (fullMapInstanceRef.current) {
        fullMapInstanceRef.current.remove();
        fullMapInstanceRef.current = null;
        fullMarkerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!fullMapRef.current || fullMapInstanceRef.current) return;

      const map = L.map(fullMapRef.current, {
        center: selectedCoords,
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      const marker = L.marker(selectedCoords, { icon: goldIcon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setSelectedCoords([pos.lat, pos.lng]);
        onCoordinatesChange?.(pos.lat, pos.lng);
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        setSelectedCoords([e.latlng.lat, e.latlng.lng]);
        onCoordinatesChange?.(e.latlng.lat, e.latlng.lng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      fullMapInstanceRef.current = map;
      fullMarkerRef.current = marker;
    }, 150);

    return () => clearTimeout(timer);
  }, [view]);

  // Focus search input when search view opens
  useEffect(() => {
    if (view === "search") {
      setTimeout(() => searchInputRef.current?.focus(), 200);
    }
  }, [view]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`,
      );
      const data = await res.json();
      if (data?.display_name) {
        setAddressQuery(data.display_name);
        onAddressChange(data.display_name);
      }
    } catch { /* silent */ }
  };

  // Geocoding search — broader search without country restriction
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (addressQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoadingGeo(true);
      try {
        // Include state/city context for better results
        const contextQuery = `${addressQuery}, ${city || ""} ${state || ""}, México`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(contextQuery)}&limit=10&addressdetails=1&accept-language=es`,
        );
        const data: GeoSuggestion[] = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingGeo(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [addressQuery]);

  const selectSuggestion = (s: GeoSuggestion) => {
    setAddressQuery(s.display_name);
    onAddressChange(s.display_name);
    setSuggestions([]);

    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setSelectedCoords([lat, lng]);
    onCoordinatesChange?.(lat, lng);

    setView("map");
    setTimeout(() => {
      if (fullMapInstanceRef.current && fullMarkerRef.current) {
        fullMapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1 });
        fullMarkerRef.current.setLatLng([lat, lng]);
      }
    }, 400);
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) return;
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setSelectedCoords([latitude, longitude]);
        onCoordinatesChange?.(latitude, longitude);
        setLocatingUser(false);
        reverseGeocode(latitude, longitude);
        
        if (view === "map" && fullMapInstanceRef.current && fullMarkerRef.current) {
          fullMapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.2 });
          fullMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          setView("map");
          setTimeout(() => {
            if (fullMapInstanceRef.current && fullMarkerRef.current) {
              fullMapInstanceRef.current.setView([latitude, longitude], 16);
              fullMarkerRef.current.setLatLng([latitude, longitude]);
            }
          }, 400);
        }
      },
      (err) => {
        console.log("Geolocation error:", err.message);
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const confirmLocation = () => {
    setView("preview");
  };

  const getShortName = (name: string) => {
    const parts = name.split(",");
    return parts.slice(0, 2).join(",").trim();
  };

  return (
    <>
      {/* ===== COMPACT PREVIEW (tappable, dark map) ===== */}
      <div className="rounded-2xl overflow-hidden border border-border">
        {/* Static dark mini map — fully non-interactive */}
        <div
          onClick={() => setView("search")}
          className="relative h-44 bg-muted overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div ref={previewMapRef} className="absolute inset-0 z-0 pointer-events-none" />
          {/* GPS button overlay on preview */}
          <button
            onClick={(e) => { e.stopPropagation(); handleLocateUser(); }}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center"
          >
            {locatingUser ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 text-primary" />
            )}
          </button>
        </div>

        {/* Search bar below map */}
        <div
          onClick={() => setView("search")}
          className="px-3 py-2.5 bg-card flex items-center gap-2 cursor-pointer border-t border-border"
        >
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-body text-muted-foreground truncate flex-1">
            {addressQuery || "Busca una dirección..."}
          </span>
        </div>

        {/* State/City selectors */}
        <div className="flex items-center gap-2 px-3 py-2 bg-card border-t border-border">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <select
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            className="bg-transparent text-xs font-body text-foreground focus:outline-none cursor-pointer"
          >
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-muted-foreground text-xs">·</span>
          <select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={!state}
            className="bg-transparent text-xs font-body text-foreground focus:outline-none cursor-pointer flex-1"
          >
            <option value="">Ciudad</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* ===== FULLSCREEN SEARCH VIEW ===== */}
      {view === "search" && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
          {/* Search header */}
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 px-3 py-3 rounded-full bg-muted border border-border">
              <button onClick={() => setView("preview")} className="flex-shrink-0">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <input
                ref={searchInputRef}
                className="flex-1 bg-transparent text-base font-body text-foreground placeholder:text-muted-foreground focus:outline-none"
                placeholder="Buscar dirección..."
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
              />
              {loadingGeo && <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />}
              {addressQuery && !loadingGeo && (
                <button onClick={() => { setAddressQuery(""); setSuggestions([]); }}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* "Mi ubicación actual" */}
          <button
            onClick={handleLocateUser}
            className="mx-3 mb-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors border-b border-border/30"
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              {locatingUser ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <Navigation className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-body font-semibold text-foreground">Mi ubicación actual</p>
              <p className="text-xs text-muted-foreground font-body">Usar GPS para detectar tu ubicación</p>
            </div>
          </button>

          {/* Suggestions */}
          <div className="flex-1 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => selectSuggestion(s)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors border-b border-border/20"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-body font-semibold text-foreground truncate">
                    {getShortName(s.display_name)}
                  </p>
                  <p className="text-xs text-muted-foreground font-body truncate">
                    {s.display_name}
                  </p>
                </div>
                <CornerDownLeft className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}

            {addressQuery.length >= 2 && suggestions.length === 0 && !loadingGeo && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground font-body">No se encontraron resultados</p>
                <p className="text-xs text-muted-foreground/60 font-body mt-1">Intenta con otra dirección</p>
              </div>
            )}

            {addressQuery.length < 2 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground font-body">Escribe para buscar una dirección</p>
              </div>
            )}
          </div>

          {/* Open map button */}
          <div className="px-4 py-3 pb-8 border-t border-border bg-card">
            <button
              onClick={() => setView("map")}
              className="w-full py-3 rounded-xl border border-primary/30 text-sm font-body font-semibold text-primary flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Elegir en el mapa
            </button>
          </div>
        </div>
      )}

      {/* ===== FULLSCREEN MAP VIEW ===== */}
      {view === "map" && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
          {/* Top bar */}
          <div className="relative z-10 px-4 pt-3 pb-2 bg-card/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("search")}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <div
                onClick={() => setView("search")}
                className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-background border border-border cursor-pointer"
              >
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-body text-muted-foreground truncate">
                  {addressQuery || "Buscar dirección..."}
                </span>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <div ref={fullMapRef} className="absolute inset-0" />

            {/* My location FAB */}
            <button
              onClick={handleLocateUser}
              className="absolute bottom-28 right-4 z-[500] w-12 h-12 rounded-full bg-card shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
              title="Mi ubicación"
            >
              {locatingUser ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <Navigation className="w-5 h-5 text-primary" />
              )}
            </button>
          </div>

          {/* Bottom confirm */}
          <div className="bg-card border-t border-border px-4 py-3 pb-8">
            {addressQuery && (
              <p className="text-xs font-body text-muted-foreground mb-2 truncate">
                 {addressQuery}
              </p>
            )}
            <button
              onClick={confirmLocation}
              className="w-full py-3.5 rounded-2xl btn-gold text-sm font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <MapPin className="w-4 h-4" />
              Confirmar ubicación
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EventLocationMap;
