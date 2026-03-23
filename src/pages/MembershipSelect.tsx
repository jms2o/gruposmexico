import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useGroupProfile } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronLeft, Crown } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

const MembershipSelect = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useGroupProfile(user?.id);
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  const { data: plans } = useQuery({
    queryKey: ["membership-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("membership_plans").select("*").eq("visible", true).order("sort_order");
      return data || [];
    },
  });

  const handleSelect = async () => {
    if (!selectedPlan || !profile) return;
    setLoading(true);
    try {
      const plan = plans?.find((p: any) => p.id === selectedPlan);
      if (!plan) throw new Error("Plan no encontrado");
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: "create_membership",
          data: { group_profile_id: profile.id, plan_id: selectedPlan, billing_period: "monthly", expires_at: expiresAt.toISOString() },
        }),
      });
      toast.success("¡Membresía seleccionada! Serás contactado para completar el pago.");
      navigate("/mi-panel");
    } catch {
      toast.success("¡Membresía solicitada! Te contactaremos para el pago.");
      navigate("/mi-panel");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || profileLoading) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20 pb-16">
        <div className="container px-4 max-w-5xl">
          <Link to="/mi-panel" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-body text-sm mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Mi panel
          </Link>

          <div className="text-center mb-10">
            <Crown className="w-10 h-10 text-gold mx-auto mb-3" />
            <h1 className="text-3xl md:text-4xl font-display font-extrabold text-foreground uppercase tracking-wide">
              Membresías Elite para Músicos
            </h1>
            <p className="text-muted-foreground font-body text-base mt-2">Eleva tu visibilidad y gana más</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {(plans || []).map((plan: any) => {
              const isSelected = selectedPlan === plan.id;
              const features = Array.isArray(plan.features) ? plan.features : [];
              const tier = plan.tier as string;

              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    "relative rounded-2xl overflow-hidden text-left flex flex-col transition-all duration-300",
                    tier === "basic" && "border-2 border-[hsl(30,10%,25%)]",
                    tier === "professional" && "border-2 border-[hsl(40,40%,40%)] shadow-lg shadow-[hsl(40,40%,30%,0.15)]",
                    tier === "premium" && "border-2 border-gold shadow-xl shadow-gold/25",
                    isSelected && "ring-2 ring-gold scale-[1.02]"
                  )}
                  style={{
                    background: tier === "basic"
                      ? "linear-gradient(180deg, hsl(30,5%,14%) 0%, hsl(30,5%,8%) 100%)"
                      : tier === "professional"
                      ? "linear-gradient(180deg, hsl(40,15%,16%) 0%, hsl(40,10%,8%) 100%)"
                      : "linear-gradient(180deg, hsl(42,35%,18%) 0%, hsl(40,20%,8%) 100%)"
                  }}
                >
                  {/* Header */}
                  <div
                    className="px-5 py-4 text-center border-b"
                    style={{
                      background: tier === "basic"
                        ? "linear-gradient(135deg, hsl(30,5%,30%) 0%, hsl(30,8%,18%) 50%, hsl(30,5%,30%) 100%)"
                        : tier === "professional"
                        ? "linear-gradient(135deg, hsl(40,25%,35%) 0%, hsl(40,15%,20%) 50%, hsl(40,25%,35%) 100%)"
                        : "linear-gradient(135deg, hsl(45,60%,55%) 0%, hsl(42,50%,40%) 30%, hsl(45,60%,55%) 50%, hsl(40,30%,35%) 70%, hsl(45,60%,55%) 100%)",
                      borderColor: tier === "premium" ? "hsl(45,50%,45%)" : tier === "professional" ? "hsl(40,30%,30%)" : "hsl(30,10%,25%)"
                    }}
                  >
                    <h3 className={cn(
                      "font-display font-extrabold text-lg uppercase tracking-widest",
                      tier === "basic" && "text-[hsl(30,10%,70%)]",
                      tier === "professional" && "text-[hsl(40,30%,80%)]",
                      tier === "premium" && "text-[hsl(42,10%,10%)]"
                    )}>
                      {plan.name}
                    </h3>
                  </div>

                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gold flex items-center justify-center z-10">
                      <Check className="w-3.5 h-3.5 text-accent-foreground" />
                    </div>
                  )}

                  <div className="px-5 py-5 flex-1 flex flex-col">
                    {/* Price */}
                    <div className="text-center mb-5 pb-4 border-b border-[hsl(40,10%,20%)]">
                      {tier === "basic" ? (
                        <span className="text-3xl font-display font-extrabold text-foreground">Gratis</span>
                      ) : (
                        <div>
                          <span className={cn(
                            "text-3xl font-display font-extrabold",
                            tier === "professional" ? "text-[hsl(40,30%,70%)]" : "text-gold"
                          )}>
                            ${Number(plan.price_monthly).toLocaleString()}
                          </span>
                          <span className="text-sm font-body text-muted-foreground ml-1">MXN/mes</span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-5 flex-1">
                      {features.map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 font-body text-sm text-foreground">
                          {tier === "premium" ? (
                            <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-gold">
                              {i === 0 ? "📍" : i === 1 ? "⭐" : "✅"}
                            </span>
                          ) : (
                            <Check className={cn(
                              "w-4 h-4 flex-shrink-0 mt-0.5",
                              tier === "professional" ? "text-[hsl(40,30%,60%)]" : "text-muted-foreground"
                            )} />
                          )}
                          <span className={cn(tier === "premium" && "font-bold uppercase text-xs tracking-wide")}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="text-center font-body text-xs text-muted-foreground mb-3 pt-3 border-t border-[hsl(40,10%,20%)]">
                      {tier === "basic" && "Aparece en últimos lugares de búsqueda"}
                      {tier === "professional" && "Mejor posición en resultados"}
                      {tier === "premium" && "MÁXIMA EXPOSICIÓN"}
                    </p>

                    <p className="text-center font-body text-xs text-muted-foreground italic">
                      Comisión por Evento: {plan.commission_rate}%
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedPlan && (
            <div className="text-center mt-10">
              <button onClick={handleSelect} disabled={loading}
                className="px-12 py-4 rounded-2xl font-display font-extrabold text-lg uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xl shadow-gold/20 text-[hsl(42,10%,10%)]"
                style={{ background: "linear-gradient(135deg, hsl(45,60%,55%) 0%, hsl(42,50%,40%) 50%, hsl(45,60%,55%) 100%)" }}>
                {loading ? "Procesando..." : "Continuar con el pago"}
              </button>
              <p className="text-xs text-muted-foreground font-body mt-3">Integración con MercadoPago próximamente</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MembershipSelect;
