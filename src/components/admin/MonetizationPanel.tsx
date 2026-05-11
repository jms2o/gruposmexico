import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/api";
import { DollarSign, TrendingUp, Users, Crown } from "lucide-react";
import { toast } from "sonner";

const MonetizationPanel = ({ password }: { password: string }) => {
  const queryClient = useQueryClient();

  const { data: plans, refetch: refetchPlans } = useQuery({
    queryKey: ["monetization-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("membership_plans").select("*").order("sort_order");
      return data || [];
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["monetization-bookings"],
    queryFn: async () => {
      const { data } = await supabase.from("bookings").select("*, group_profiles(group_name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: commissions } = useQuery({
    queryKey: ["monetization-commissions"],
    queryFn: async () => {
      const { data } = await supabase.from("commission_history").select("*, group_profiles(group_name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: memberships } = useQuery({
    queryKey: ["monetization-memberships"],
    queryFn: async () => {
      const { data } = await supabase.from("group_memberships").select("*, membership_plans(name, commission_rate), group_profiles(group_name)").eq("status", "active");
      return data || [];
    },
  });

  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [rateValue, setRateValue] = useState("");

  const updateRate = async (planId: string) => {
    try {
      await adminApi.call(password, {
        action: "update", table: "membership_plans", id: planId,
        data: { commission_rate: Number(rateValue) },
      });
      toast.success("Comisión actualizada");
      setEditingRate(null);
      refetchPlans();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Stats
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const monthlyCommissions = (commissions || []).filter((c: any) => {
    const d = new Date(c.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const totalMonthlyRevenue = monthlyCommissions.reduce((sum: number, c: any) => sum + Number(c.amount), 0);
  const totalAllTime = (commissions || []).reduce((sum: number, c: any) => sum + Number(c.amount), 0);

  // Group earnings by musician
  const earningsByMusician: Record<string, { name: string; total: number }> = {};
  (commissions || []).forEach((c: any) => {
    const id = c.group_profile_id;
    if (!earningsByMusician[id]) earningsByMusician[id] = { name: c.group_profiles?.group_name || "—", total: 0 };
    earningsByMusician[id].total += Number(c.amount);
  });

  return (
    <div className="space-y-8">
      <h3 className="font-display font-bold text-foreground text-xl flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-gold" /> Panel de Monetización
      </h3>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <p className="text-2xl font-display font-bold text-gold">${totalMonthlyRevenue.toLocaleString()}</p>
          <p className="text-xs font-body text-muted-foreground">Comisiones este mes</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <p className="text-2xl font-display font-bold text-foreground">${totalAllTime.toLocaleString()}</p>
          <p className="text-xs font-body text-muted-foreground">Comisiones totales</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <p className="text-2xl font-display font-bold text-foreground">{memberships?.length || 0}</p>
          <p className="text-xs font-body text-muted-foreground">Membresías activas</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 text-center">
          <p className="text-2xl font-display font-bold text-foreground">{bookings?.length || 0}</p>
          <p className="text-xs font-body text-muted-foreground">Reservas totales</p>
        </div>
      </div>

      {/* Commission rates by plan */}
      <div>
        <h4 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
          <Crown className="w-4 h-4 text-gold" /> Comisiones por membresía
        </h4>
        <div className="grid md:grid-cols-3 gap-4">
          {(plans || []).map((plan: any) => (
            <div key={plan.id} className="bg-card border border-border rounded-2xl p-5">
              <p className="font-display font-bold text-foreground">{plan.badge} {plan.name}</p>
              {editingRate === plan.id ? (
                <div className="mt-2 flex gap-2">
                  <input type="number" value={rateValue} onChange={(e) => setRateValue(e.target.value)}
                    className="w-20 px-2 py-1 rounded-lg bg-muted border border-border text-foreground font-body text-sm" />
                  <span className="font-body text-sm text-muted-foreground self-center">%</span>
                  <button onClick={() => updateRate(plan.id)} className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-body text-xs font-bold">OK</button>
                  <button onClick={() => setEditingRate(null)} className="px-3 py-1 rounded-lg bg-muted text-foreground font-body text-xs">✕</button>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-2xl font-display font-bold text-gold">{plan.commission_rate}%</span>
                  <button onClick={() => { setEditingRate(plan.id); setRateValue(String(plan.commission_rate)); }}
                    className="text-xs font-body text-muted-foreground hover:text-foreground underline">Editar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Earnings by musician */}
      {Object.keys(earningsByMusician).length > 0 && (
        <div>
          <h4 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gold" /> Comisiones por músico
          </h4>
          <div className="space-y-2">
            {Object.entries(earningsByMusician)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([id, data]) => (
                <div key={id} className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
                  <span className="font-body text-sm text-foreground">{data.name}</span>
                  <span className="font-display font-bold text-gold">${data.total.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent bookings */}
      {(bookings || []).length > 0 && (
        <div>
          <h4 className="font-display font-bold text-foreground mb-3">Historial de reservas</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-body text-muted-foreground">Cliente</th>
                  <th className="text-left py-2 px-2 font-body text-muted-foreground">Músico</th>
                  <th className="text-left py-2 px-2 font-body text-muted-foreground">Total</th>
                  <th className="text-left py-2 px-2 font-body text-muted-foreground">Comisión</th>
                  <th className="text-left py-2 px-2 font-body text-muted-foreground">Anticipo</th>
                  <th className="text-left py-2 px-2 font-body text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {(bookings || []).slice(0, 20).map((b: any) => (
                  <tr key={b.id} className="border-b border-border/50">
                    <td className="py-2 px-2 font-body text-foreground">{b.client_name}</td>
                    <td className="py-2 px-2 font-body text-muted-foreground">{b.group_profiles?.group_name || "—"}</td>
                    <td className="py-2 px-2 font-body text-foreground">${Number(b.total).toLocaleString()}</td>
                    <td className="py-2 px-2 font-body text-gold">${Number(b.commission_amount).toLocaleString()}</td>
                    <td className="py-2 px-2 font-body text-muted-foreground">{b.advance_paid ? "" : ""}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${b.status === "confirmed" ? "bg-primary/20 text-primary" : b.status === "completed" ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(bookings || []).length === 0 && (commissions || []).length === 0 && (
        <p className="text-center text-muted-foreground font-body py-8">Aún no hay reservas ni comisiones registradas.</p>
      )}
    </div>
  );
};

export default MonetizationPanel;
