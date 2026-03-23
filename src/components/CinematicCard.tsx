import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Star } from "lucide-react";

interface HSL { h: number; s: number; l: number }

function extractColor(img: HTMLImageElement): HSL {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { h: 40, s: 65, l: 50 };
  const size = 48;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const buckets: Map<string, { total: { r: number; g: number; b: number }; count: number }> = new Map();
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;
    const brightness = (r + g + b) / 3;
    if (brightness < 30 || brightness > 230) continue;
    const qr = Math.floor(r / 32) * 32;
    const qg = Math.floor(g / 32) * 32;
    const qb = Math.floor(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    const bucket = buckets.get(key) || { total: { r: 0, g: 0, b: 0 }, count: 0 };
    bucket.total.r += r; bucket.total.g += g; bucket.total.b += b;
    bucket.count++;
    buckets.set(key, bucket);
  }
  let bestColor = { r: 200, g: 170, b: 100 };
  let bestScore = 0;
  for (const bucket of buckets.values()) {
    if (bucket.count < 3) continue;
    const avg = {
      r: Math.round(bucket.total.r / bucket.count),
      g: Math.round(bucket.total.g / bucket.count),
      b: Math.round(bucket.total.b / bucket.count),
    };
    const r = avg.r / 255, g = avg.g / 255, b = avg.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let s = 0;
    if (max !== min) s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
    const satScore = s * 100;
    const lightScore = 100 - Math.abs(l * 100 - 45) * 2;
    const countScore = Math.min(bucket.count * 2, 100);
    const score = satScore * 2 + lightScore + countScore;
    if (score > bestScore) { bestScore = score; bestColor = avg; }
  }
  const r2 = bestColor.r / 255, g2 = bestColor.g / 255, b2 = bestColor.b / 255;
  const max2 = Math.max(r2, g2, b2), min2 = Math.min(r2, g2, b2);
  let h2 = 0, s2 = 0;
  const l2 = (max2 + min2) / 2;
  if (max2 !== min2) {
    const d = max2 - min2;
    s2 = l2 > 0.5 ? d / (2 - max2 - min2) : d / (max2 + min2);
    switch (max2) {
      case r2: h2 = ((g2 - b2) / d + (g2 < b2 ? 6 : 0)) / 6; break;
      case g2: h2 = ((b2 - r2) / d + 2) / 6; break;
      case b2: h2 = ((r2 - g2) / d + 4) / 6; break;
    }
  }
  return {
    h: Math.round(h2 * 360),
    s: Math.max(Math.round(s2 * 100), 40),
    l: Math.max(Math.min(Math.round(l2 * 100), 60), 35),
  };
}

interface CinematicCardProps {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  linkTo: string;
  whatsappUrl?: string;
  badge?: string;
  showRating?: boolean;
}

const CinematicCard = ({ id, name, price, imageUrl, linkTo, whatsappUrl, badge, showRating }: CinematicCardProps) => {
  const [color, setColor] = useState<HSL>({ h: 40, s: 65, l: 50 });
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try { setColor(extractColor(img)); } catch {}
      setLoaded(true);
    };
    img.onerror = () => setLoaded(true);
    img.src = imageUrl;
  }, [imageUrl]);

  const accent = `hsl(${color.h} ${color.s}% ${color.l}%)`;
  const accentGlow = `hsl(${color.h} ${Math.min(color.s + 10, 100)}% ${Math.min(color.l + 20, 75)}%)`;
  const accentDim = `hsl(${color.h} ${color.s}% ${color.l}% / 0.3)`;

  return (
    <div
      className="group relative rounded-2xl overflow-hidden transition-all duration-500"
      style={{
        boxShadow: loaded ? `0 0 30px -5px ${accentDim}, 0 0 60px -10px ${accentDim}, inset 0 1px 0 0 ${accentDim}` : undefined,
        border: `1px solid ${accentDim}`,
      }}
    >
      {/* Glow border effect */}
      <div
        className="absolute inset-0 rounded-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none z-10"
        style={{
          boxShadow: `inset 0 0 20px 0 ${accentDim}, 0 0 40px -10px ${accentDim}`,
        }}
      />

      {/* Badge */}
      {badge && (
        <span
          className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-xs font-body font-bold"
          style={{ background: accent, color: "#fff" }}
        >
          {badge}
        </span>
      )}

      {/* Star icon */}
      <div
        className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm"
        style={{ background: `${accentDim}`, border: `1px solid ${accentDim}` }}
      >
        <Star className="w-4 h-4" style={{ color: accentGlow }} />
      </div>

      {/* Image */}
      <Link to={linkTo} className="block">
        <div className="aspect-[3/4] sm:aspect-[4/5] overflow-hidden relative">
          <img
            ref={imgRef}
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
            crossOrigin="anonymous"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          
          {/* Colored ambient light at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1/3 opacity-30 group-hover:opacity-50 transition-opacity duration-500"
            style={{
              background: `radial-gradient(ellipse at center bottom, ${accent}, transparent 70%)`,
            }}
          />

          {/* Particles overlay */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {loaded && Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${Math.random() * 3 + 1}px`,
                  height: `${Math.random() * 3 + 1}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${40 + Math.random() * 50}%`,
                  background: accentGlow,
                  opacity: Math.random() * 0.5 + 0.2,
                  animation: `spark-rise ${Math.random() * 4 + 3}s ${Math.random() * 5}s ease-out infinite`,
                  boxShadow: `0 0 4px ${accentGlow}`,
                }}
              />
            ))}
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="relative z-10 p-5 -mt-2" style={{ background: 'linear-gradient(to bottom, transparent, hsl(25 15% 7%) 20%)' }}>
        <Link to={linkTo}>
          <h3
            className="text-2xl sm:text-3xl font-display font-bold text-white mb-1 group-hover:drop-shadow-lg transition-all"
            style={{ textShadow: `0 0 20px ${accentDim}` }}
          >
            {name}
          </h3>
        </Link>

        {showRating && (
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: accentGlow }} />
            ))}
            <span className="text-xs text-white/50 font-body ml-1">5.0</span>
          </div>
        )}

        <p className="font-body text-base sm:text-lg mb-4" style={{ color: accentGlow }}>
          Desde <span className="font-bold text-xl sm:text-2xl">{price}</span>
        </p>

        <div className="flex items-center gap-2">
          <Link
            to={linkTo}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-body font-semibold transition-all duration-300 border"
            style={{
              borderColor: `${accentDim}`,
              color: accentGlow,
              background: `${accent}15`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${accent}30`;
              e.currentTarget.style.borderColor = accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${accent}15`;
              e.currentTarget.style.borderColor = accentDim;
            }}
          >
            VER DISPONIBILIDAD →
          </Link>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
              style={{
                background: accent,
                boxShadow: `0 4px 20px -4px ${accentDim}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 4px 30px -2px ${accent}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 4px 20px -4px ${accentDim}`;
              }}
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default CinematicCard;
