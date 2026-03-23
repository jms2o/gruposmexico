import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Check, Crown, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  profile: any;
  membership: any;
}

const MembershipSection = ({ profile, membership }: Props) => {
  const { data: plans } = useQuery({
    queryKey: ["membership-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("membership_plans").select("*").eq("visible", true).order("sort_order");
      return data || [];
    },
  });

  const isExpired = membership?.expires_at && new Date(membership.expires_at) < new Date();
  const currentPlanId = membership?.plan_id;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-extrabold text-foreground uppercase tracking-wide mb-2">
          Membresías Elite para Músicos
        </h2>
        <p className="font-body text-base text-muted-foreground max-w-md mx-auto">
          Eleva tu visibilidad y gana más
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {(plans || []).map((plan: any) => {
          const isActive = plan.id === currentPlanId && !isExpired;
          const features = Array.isArray(plan.features) ? plan.features : [];
          const tier = plan.tier as string;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300",
                tier === "basic" && "border-2 border-[hsl(30,10%,25%)]",
                tier === "professional" && "border-2 border-[hsl(40,40%,40%)] shadow-lg shadow-[hsl(40,40%,30%,0.15)]",
                tier === "premium" && "border-2 border-gold shadow-xl shadow-gold/25 scale-[1.02]",
                isActive && "ring-2 ring-gold/50"
              )}
              style={{
                background: tier === "basic"
                  ? "linear-gradient(180deg, hsl(30,5%,14%) 0%, hsl(30,5%,8%) 100%)"
                  : tier === "professional"
                  ? "linear-gradient(180deg, hsl(40,15%,16%) 0%, hsl(40,10%,8%) 100%)"
                  : "linear-gradient(180deg, hsl(42,35%,18%) 0%, hsl(40,20%,8%) 100%)"
              }}
            >
              {/* Header bar */}
              <div
                className={cn("px-5 py-4 text-center border-b")}
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

              {isActive && (
                <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-gold text-accent-foreground text-[10px] font-body font-bold z-10">
                  ACTUAL
                </span>
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
                          {i === 0 ? "📍" : i === 1 ? "⭐" : i === 2 ? "✅" : "✅"}
                        </span>
                      ) : (
                        <Check className={cn(
                          "w-4 h-4 flex-shrink-0 mt-0.5",
                          tier === "professional" ? "text-[hsl(40,30%,60%)]" : "text-muted-foreground"
                        )} />
                      )}
                      <span className={cn(
                        tier === "premium" && "font-bold uppercase text-xs tracking-wide"
                      )}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Footer - position note */}
                <p className="text-center font-body text-xs text-muted-foreground mb-3 pt-3 border-t border-[hsl(40,10%,20%)]">
                  {tier === "basic" && "Aparece en últimos lugares de búsqueda"}
                  {tier === "professional" && "Mejor posición en resultados"}
                  {tier === "premium" && "MÁXIMA EXPOSICIÓN"}
                </p>

                {/* Commission */}
                <p className="text-center font-body text-xs text-muted-foreground mb-4 italic">
                  Comisión por Evento: {plan.commission_rate}%
                </p>

                {/* CTA */}
                <Link
                  to="/membresias"
                  className={cn(
                    "block text-center px-4 py-3.5 rounded-xl font-display font-extrabold text-sm uppercase tracking-wider transition-all",
                    isActive && "bg-muted text-muted-foreground cursor-default",
                    !isActive && tier === "basic" && "border-2 border-[hsl(30,10%,35%)] text-[hsl(30,10%,70%)] hover:bg-[hsl(30,10%,20%)]",
                    !isActive && tier === "professional" && "text-[hsl(42,10%,10%)] hover:opacity-90 shadow-lg",
                    !isActive && tier === "premium" && "text-[hsl(42,10%,10%)] hover:opacity-90 shadow-xl shadow-gold/30"
                  )}
                  style={!isActive ? {
                    background: tier === "professional"
                      ? "linear-gradient(135deg, hsl(40,25%,35%) 0%, hsl(40,20%,25%) 50%, hsl(40,25%,35%) 100%)"
                      : tier === "premium"
                      ? "linear-gradient(135deg, hsl(45,60%,55%) 0%, hsl(42,50%,40%) 50%, hsl(45,60%,55%) 100%)"
                      : undefined
                  } : undefined}
                >
                  {isActive ? "Plan activo ✓" : tier === "basic" ? "Comenzar Gratis" : tier === "professional" ? "Elegir Destacado" : "Unirse a Elite"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MembershipSection;
