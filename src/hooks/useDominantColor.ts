import { useState, useEffect } from "react";

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }

function rgbToHsl({ r, g, b }: RGB): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getDominantColor(img: HTMLImageElement): HSL {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { h: 40, s: 65, l: 50 }; // fallback gold

  const size = 64;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(img, 0, 0, size, size);

  const data = ctx.getImageData(0, 0, size, size).data;
  const buckets: Map<string, { total: RGB; count: number }> = new Map();

  for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;
    // Skip very dark or very light pixels
    const brightness = (r + g + b) / 3;
    if (brightness < 30 || brightness > 230) continue;
    // Quantize to 16-step buckets
    const qr = Math.floor(r / 32) * 32;
    const qg = Math.floor(g / 32) * 32;
    const qb = Math.floor(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    const bucket = buckets.get(key) || { total: { r: 0, g: 0, b: 0 }, count: 0 };
    bucket.total.r += r;
    bucket.total.g += g;
    bucket.total.b += b;
    bucket.count++;
    buckets.set(key, bucket);
  }

  // Find the most saturated prominent color
  let bestColor: RGB = { r: 200, g: 170, b: 100 };
  let bestScore = 0;

  for (const bucket of buckets.values()) {
    if (bucket.count < 3) continue;
    const avg: RGB = {
      r: Math.round(bucket.total.r / bucket.count),
      g: Math.round(bucket.total.g / bucket.count),
      b: Math.round(bucket.total.b / bucket.count),
    };
    const hsl = rgbToHsl(avg);
    // Score: prefer saturated, mid-lightness colors
    const satScore = hsl.s;
    const lightScore = 100 - Math.abs(hsl.l - 45) * 2;
    const countScore = Math.min(bucket.count * 2, 100);
    const score = satScore * 2 + lightScore + countScore;
    if (score > bestScore) {
      bestScore = score;
      bestColor = avg;
    }
  }

  const hsl = rgbToHsl(bestColor);
  // Ensure minimum saturation for visual impact
  hsl.s = Math.max(hsl.s, 40);
  // Clamp lightness for accent use on dark backgrounds
  hsl.l = Math.max(Math.min(hsl.l, 60), 35);
  return hsl;
}

export function useDominantColor(imageUrl: string | undefined) {
  const [color, setColor] = useState<HSL>({ h: 40, s: 65, l: 50 }); // default gold
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;
    setIsReady(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const dominant = getDominantColor(img);
        setColor(dominant);
      } catch {
        // keep default
      }
      setIsReady(true);
    };
    img.onerror = () => setIsReady(true);
    img.src = imageUrl;
  }, [imageUrl]);

  const hslStr = `${color.h} ${color.s}% ${color.l}%`;
  const cssVars = {
    "--accent-dynamic": hslStr,
    "--accent-dynamic-glow": `${color.h} ${Math.min(color.s + 10, 100)}% ${Math.min(color.l + 15, 75)}%`,
    "--accent-dynamic-dim": `${color.h} ${Math.max(color.s - 15, 20)}% ${Math.max(color.l - 15, 20)}%`,
  } as React.CSSProperties;

  return { color, hslStr, cssVars, isReady };
}
