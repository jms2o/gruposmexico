import { useAdminMemberships, useAdminMembershipPlans } from "@/hooks/useAdminData";
import { adminApi } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const cardStyle = { background: "hsl(230 15% 11%)", border: "1px solid hsl(230 10% 16%)", borderRadius: "16px" };

const AdminMembresias = ({ password, onRefresh }: { password: string; onRefresh: () => void }) => {
  const queryClient = useQueryClient();
  const { data: plans, refetch: refetchPlans } = useAdminMembershipPlans(password);
  const { data: memberships } = useAdminMemberships(password);

  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const startEdit = (plan: any) => {
    setEditing(plan.id);
    setForm({ ...plan, features: Array.isArray(plan.features) ? plan.features.join("\n") : "" });
  };

  const save = async () => {
    try {
      const features = form.features.split("\n").map((f: string) => f.trim()).filter(Boolean);
      await adminApi.call(password, {
        action: "update", table: "membership_plans", id: editing,
        data: { name: form.name, tier: form.tier, price_monthly: Number(form.price_monthly), price_annual: Number(form.price_annual), max_photos: Number(form.max_photos), max_videos: Number(form.max_videos), features, badge: form.badge, highlighted: form.highlighted, visible: form.visible, sort_order: Number(form.sort_order), commission_rate: Number(form.commission_rate || 30) },
      });
      toast.success("Plan actualizado");
      setEditing(null);
      refetchPlans();
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (err: any) { toast.error(err.message); }
  };

  const active = memberships?.filter((m: any) => m.status === "active") || [];
  const expired = memberships?.filter((m: any) => m.status === "expired") || [];

  const tierColor = (tier: string) => {
    if (tier === "premium") return "hsl(40 65% 55%)";
    if (tier === "professional") return "hsl(265 60% 65%)";
    return "hsl(230 10% 55%)";
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-xl" style={{ color: "hsl(0 0% 95%)" }}>Membresías</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Activas", count: active.length, color: "hsl(142 70% 55%)" },
          { label: "Expiradas", count: expired.length, color: "hsl(0 70% 55%)" },
          { label: "Total", count: memberships?.length || 0, color: "hsl(265 60% 65%)" },
        ].map(s => (
          <div key={s.label} className="p-5 rounded-2xl" style={cardStyle}>
            <p className="font-body text-xs mb-2" style={{ color: "hsl(230 10% 50%)" }}>{s.label}</p>
            <p className="text-3xl font-display font-extrabold" style={{ color: s.color }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Plans */}
      <div className="p-5" style={cardStyle}>
        <h3 className="font-display font-bold text-base mb-4" style={{ color: "hsl(0 0% 95%)" }}>Planes</h3>
        <div className="space-y-3">
          {(plans || []).map((plan: any) => (
            <div key={plan.id} className="p-4 rounded-xl" style={{ background: "hsl(230 15% 13%)", border: "1px solid hsl(230 10% 18%)" }}>
              {editing === plan.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "name", ph: "Nombre", type: "text" },
                      { key: "badge", ph: "Badge", type: "text" },
                      { key: "price_monthly", ph: "Precio mensual", type: "number" },
                      { key: "price_annual", ph: "Precio anual", type: "number" },
                      { key: "max_photos", ph: "Máx fotos", type: "number" },
                      { key: "max_videos", ph: "Máx videos", type: "number" },
                      { key: "commission_rate", ph: "Comisión %", type: "number" },
                      { key: "sort_order", ph: "Orden", type: "number" },
                    ].map(f => (
                      <input key={f.key} type={f.type} value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph}
                        className="px-3 py-2 rounded-lg font-body text-sm outline-none" style={{ background: "hsl(230 15% 16%)", border: "1px solid hsl(230 10% 22%)", color: "hsl(0 0% 85%)" }} />
                    ))}
                  </div>
                  <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Beneficios (uno por línea)" rows={3}
                    className="w-full px-3 py-2 rounded-lg font-body text-sm resize-none outline-none" style={{ background: "hsl(230 15% 16%)", border: "1px solid hsl(230 10% 22%)", color: "hsl(0 0% 85%)" }} />
                  <div className="flex gap-2">
                    <button onClick={save} className="px-4 py-2 rounded-lg font-body font-bold text-xs text-white" style={{ background: "hsl(265 60% 55%)" }}>Guardar</button>
                    <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg font-body text-xs" style={{ background: "hsl(230 10% 16%)", color: "hsl(230 10% 55%)" }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display font-bold" style={{ color: tierColor(plan.tier) }}>{plan.badge} {plan.name}</h4>
                    <p className="font-body text-xs mt-1" style={{ color: "hsl(230 10% 50%)" }}>
                      ${Number(plan.price_monthly).toLocaleString()}/mes · {plan.commission_rate}% comisión · {plan.max_photos} fotos · {plan.max_videos} videos
                    </p>
                  </div>
                  <button onClick={() => startEdit(plan)} className="px-3 py-1.5 rounded-lg font-body text-xs" style={{ background: "hsl(230 10% 16%)", color: "hsl(230 10% 60%)" }}>Editar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active memberships */}
      <div className="p-5 overflow-x-auto" style={cardStyle}>
        <h3 className="font-display font-bold text-base mb-4" style={{ color: "hsl(0 0% 95%)" }}>Membresías Activas</h3>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid hsl(230 10% 16%)" }}>
              {["Grupo", "Plan", "Estado", "Expira"].map(h => (
                <th key={h} className="text-left py-2 px-2 font-body text-xs font-semibold" style={{ color: "hsl(230 10% 45%)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(memberships || []).length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center font-body text-sm" style={{ color: "hsl(230 10% 40%)" }}>Sin membresías</td></tr>
            )}
            {(memberships || []).slice(0, 20).map((m: any) => (
              <tr key={m.id} style={{ borderBottom: "1px solid hsl(230 10% 14%)" }}>
                <td className="py-3 px-2 font-body text-sm" style={{ color: "hsl(0 0% 85%)" }}>{m.group_profiles?.group_name || "—"}</td>
                <td className="py-3 px-2 font-body text-sm" style={{ color: tierColor(m.membership_plans?.tier || "") }}>{m.membership_plans?.name || "—"}</td>
                <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-full font-body text-[11px] font-semibold"
                  style={m.status === "active" ? { background: "hsl(142 70% 45% / 0.15)", color: "hsl(142 70% 55%)" } : { background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 60%)" }}>
                  {m.status}</span></td>
                <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 50%)" }}>{m.expires_at ? new Date(m.expires_at).toLocaleDateString("es-MX") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminMembresias;
