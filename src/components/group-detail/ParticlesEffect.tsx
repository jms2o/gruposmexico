import { useEffect, useRef } from "react";

interface Props {
  color: { h: number; s: number; l: number };
  count?: number;
}

const ParticlesEffect = ({ color, count = 35 }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("div");
      const isEmber = Math.random() > 0.5;
      const size = isEmber ? Math.random() * 4 + 2 : Math.random() * 2.5 + 0.5;
      const x = Math.random() * 100;
      const y = 40 + Math.random() * 60; // concentrate in lower portion
      const delay = Math.random() * 8;
      const duration = Math.random() * 5 + 3;
      const drift = (Math.random() - 0.5) * 40;
      const lightAdd = isEmber ? 25 : 15;
      const maxOpacity = isEmber ? 0.7 : 0.35;

      particle.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: radial-gradient(circle, hsl(${color.h} ${Math.min(color.s + 20, 100)}% ${Math.min(color.l + lightAdd, 85)}%), hsl(${color.h} ${color.s}% ${color.l}%));
        opacity: 0;
        pointer-events: none;
        filter: blur(${isEmber ? 0 : 0.5}px);
        box-shadow: 0 0 ${size * 2}px hsl(${color.h} ${color.s}% ${Math.min(color.l + lightAdd, 80)}% / 0.6);
        animation: spark-rise ${duration}s ${delay}s ease-out infinite;
        --drift: ${drift}px;
        --max-opacity: ${maxOpacity};
      `;
      el.appendChild(particle);
    }
  }, [color, count]);

  return (
    <>
      <style>{`
        @keyframes spark-rise {
          0% { 
            opacity: 0; 
            transform: translateY(0) translateX(0) scale(1); 
          }
          10% { 
            opacity: var(--max-opacity, 0.5); 
          }
          50% { 
            opacity: var(--max-opacity, 0.5); 
            transform: translateY(-60px) translateX(var(--drift, 10px)) scale(0.8); 
          }
          100% { 
            opacity: 0; 
            transform: translateY(-120px) translateX(calc(var(--drift, 10px) * 1.5)) scale(0.3); 
          }
        }
      `}</style>
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none z-[1]"
      />
    </>
  );
};

export default ParticlesEffect;
