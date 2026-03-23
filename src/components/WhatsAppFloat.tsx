import { MessageCircle } from "lucide-react";
import { useWhatsappNumber } from "@/hooks/useData";

const WhatsAppFloat = () => {
  const { data: whatsappNumber } = useWhatsappNumber();
  const num = whatsappNumber || "5216691234567";
  const url = `https://wa.me/${num}?text=${encodeURIComponent("Hola, quiero información sobre grupos musicales.")}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-whatsapp text-white font-body font-bold shadow-2xl hover:bg-whatsapp-hover transition-all duration-200 hover:scale-105 animate-pulse-glow"
      aria-label="Reservar por WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="hidden sm:inline">¡Reserva ahora!</span>
    </a>
  );
};

export default WhatsAppFloat;
