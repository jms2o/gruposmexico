import { Music, MessageCircle, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useWhatsappNumber, useSiteContent } from "@/hooks/useData";

const Footer = () => {
  const { data: whatsappNumber } = useWhatsappNumber();
  const { data: footerContent } = useSiteContent("footer");
  const { data: contactContent } = useSiteContent("contact");
  const num = whatsappNumber || "5216691234567";

  const getFooter = (key: string, fallback: string) => {
    const item = footerContent?.find((c: any) => c.key === key);
    return item?.value || fallback;
  };

  const getContact = (key: string, fallback: string) => {
    const item = contactContent?.find((c: any) => c.key === key);
    return item?.value || fallback;
  };

  return (
    <footer className="relative overflow-hidden bg-[hsl(30,15%,5%)] text-white/60 font-body">
      {/* Top gold line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      
      {/* Subtle gold glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[hsla(40,65%,50%,0.03)] blur-[80px] rounded-full" />

      <div className="relative z-10 container px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Music className="w-7 h-7 text-gold" />
              <span className="text-xl font-display font-bold text-white">
                {getFooter("brand_name", "GruposMéxico")}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/40">
              {getFooter("brand_description", "La plataforma #1 para contratar grupos musicales en todo México. Más de 500 eventos exitosos.")}
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-gold-light mb-4 text-sm uppercase tracking-wider">Navegación</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="hover:text-gold transition-colors">Inicio</Link></li>
              <li><Link to="/todos-los-grupos" className="hover:text-gold transition-colors">Todos los grupos</Link></li>
              <li><Link to="/paquetes" className="hover:text-gold transition-colors">Paquetes de Sonido</Link></li>
              <li><Link to="/auth" className="hover:text-gold transition-colors">Registrar mi grupo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-gold-light mb-4 text-sm uppercase tracking-wider">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" /> {getContact("location", "México")}
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" /> {getContact("hours", "Atención 24/7")}
              </li>
              <li>
                <a href={`https://wa.me/${num}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gold transition-colors">
                  <MessageCircle className="w-4 h-4 text-gold" /> WhatsApp directo
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-xs text-white/25">
            {getFooter("copyright", " 2026 GruposMéxico. Todos los derechos reservados.")}
          </p>
        </div>
      </div>
      {/* Bottom nav spacer for mobile */}
      <div className="h-20 md:hidden" />
    </footer>
  );
};

export default Footer;
