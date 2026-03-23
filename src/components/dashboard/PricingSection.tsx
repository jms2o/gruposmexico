import { useState, useEffect } from "react";
import { DollarSign, Save } from "lucide-react";
import { toast } from "sonner";

interface Props {
  profile: any;
  onSubmitContent: (type: string, content: any) => Promise<void>;
}

const PricingSection = ({ profile, onSubmitContent }: Props) => {
  const [pricePerHour, setPricePerHour] = useState(String(profile.price_per_hour || 0));
  const [minHours, setMinHours] = useState(String(profile.min_hours || 3));

  useEffect(() => {
    if (profile) {
      setPricePerHour(String(profile.price_per_hour || 0));
      setMinHours(String(profile.min_hours || 3));
    }
  }, [profile]);

  const price = Number(pricePerHour) || 0;
  const hours = Number(minHours) || 3;
  const total = price * hours;

  const handleSave = async () => {
    if (price <= 0) { toast.error("El precio por hora debe ser mayor a $0"); return; }
    if (hours <= 0) { toast.error("La renta mínima debe ser al menos 1 hora"); return; }
    await onSubmitContent("pricing", {
      price_per_hour: price,
      min_hours: hours,
      previous_price_per_hour: Number(profile?.price_per_hour || 0),
      previous_min_hours: Number(profile?.min_hours || 3),
    });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-gold" /> Configuración de Precios
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Price inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body font-semibold text-foreground mb-2">Precio por hora y renta mínima</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 flex-1">
                <span className="text-muted-foreground font-body font-bold">$</span>
                <input
                  type="number"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl bg-muted border border-border text-foreground font-body font-bold text-lg focus:ring-2 focus:ring-ring outline-none"
                  placeholder="2,000"
                />
                <span className="text-muted-foreground font-body text-sm whitespace-nowrap">MXN</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={minHours}
                  onChange={(e) => setMinHours(e.target.value)}
                  min={1}
                  className="w-16 px-3 py-3 rounded-xl bg-muted border border-border text-foreground font-body font-bold text-lg text-center focus:ring-2 focus:ring-ring outline-none"
                />
                <span className="text-muted-foreground font-body text-sm">horas</span>
              </div>
            </div>
          </div>

          <button onClick={handleSave} className="btn-whatsapp px-6 py-3 text-sm flex items-center gap-2">
            <Save className="w-4 h-4" /> Guardar cambios
          </button>
        </div>

        {/* Calculated preview */}
        <div className="bg-muted rounded-xl p-5 border border-border">
          <p className="font-body text-sm text-muted-foreground mb-3">Vista previa para el cliente:</p>
          {price > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Precio por hora</span>
                <span className="font-semibold text-foreground">${price.toLocaleString()} MXN</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Renta mínima</span>
                <span className="font-semibold text-foreground">{hours} horas</span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between font-body">
                  <span className="font-bold text-foreground">Mínimo para el cliente</span>
                  <span className="font-display font-bold text-xl text-primary">${total.toLocaleString()} MXN</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="font-body text-sm text-muted-foreground italic">Precio no configurado. Ingresa un precio mayor a $0.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
