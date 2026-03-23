import { useNavigate } from "react-router-dom";
import { Send, Music } from "lucide-react";

const QuoteForm = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-background" id="cotizar">
      <div className="container px-4 max-w-2xl text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Music className="w-6 h-6 text-gold" />
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">
            Solicitar <span className="text-gradient-gold">Tocada</span>
          </h2>
        </div>
        <p className="text-muted-foreground mb-8 font-body">
          Publica tu evento y recibe postulaciones de los mejores músicos de tu ciudad
        </p>
        <div className="section-divider mb-12" />

        <div className="bg-card border border-gold/20 rounded-2xl p-8 md:p-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center mx-auto mb-6 border border-gold/20">
            <Music className="w-8 h-8 text-gold" />
          </div>
          <h3 className="font-display font-bold text-foreground text-xl mb-2">¿Necesitas música para tu evento?</h3>
          <p className="font-body text-muted-foreground text-sm mb-6">
            Crea una solicitud en minutos. Los grupos musicales de tu ciudad podrán postularse con sus mejores precios.
          </p>
          <ul className="text-left space-y-3 mb-8 max-w-sm mx-auto">
            {["Elige género, fecha y duración", "Recibe postulaciones de grupos locales", "Compara precios y elige al mejor", "Comunicación segura por chat"].map((item) => (
              <li key={item} className="flex items-start gap-2 font-body text-sm text-muted-foreground">
                <span className="text-gold mt-0.5">✓</span> {item}
              </li>
            ))}
          </ul>
          <button onClick={() => navigate("/solicitar-evento")} className="w-full btn-gold py-4 text-lg uppercase tracking-wider">
            <Send className="w-5 h-5" />
            Crear solicitud
          </button>
        </div>
      </div>
    </section>
  );
};

export default QuoteForm;
