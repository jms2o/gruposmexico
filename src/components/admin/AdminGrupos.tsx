import { useAdminGroupProfiles } from "@/hooks/useAdminData";
import { adminApi } from "@/lib/api";
import { Search, Check, X, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const cardStyle = { background: "hsl(230 15% 11%)", border: "1px solid hsl(230 10% 16%)", borderRadius: "16px" };

const AdminGrupos = ({ password, onRefresh }: { password: string; onRefresh: () => void }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: profiles, refetch } = useAdminGroupProfiles(password);

  const filtered = (profiles || []).filter((p: any) => {
    if (filter === "pending" && p.status !== "pending") return false;
    if (filter === "approved" && p.status !== "approved") return false;
    if (filter === "hidden" && p.status !== "hidden") return false;
    if (search && !p.group_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminApi.call(password, { action: "update", table: "group_profiles", id, data: { status } });
      toast.success(`Estado actualizado a ${status}`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const statusBadge = (s: string) => {
    if (s === "approved") return { bg: "hsl(142 70% 45% / 0.15)", color: "hsl(142 70% 55%)", label: "Activo" };
    if (s === "pending") return { bg: "hsl(40 65% 50% / 0.15)", color: "hsl(40 65% 60%)", label: "Pendiente" };
    return { bg: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 60%)", label: "Oculto" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl" style={{ color: "hsl(0 0% 95%)" }}>Grupos Musicales</h2>
        <span className="font-body text-sm" style={{ color: "hsl(230 10% 45%)" }}>{profiles?.length || 0} registrados</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "hsl(230 15% 13%)", border: "1px solid hsl(230 10% 18%)" }}>
          <Search className="w-4 h-4" style={{ color: "hsl(230 10% 40%)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar grupo..." className="bg-transparent outline-none font-body text-sm w-48" style={{ color: "hsl(0 0% 85%)" }} />
        </div>
        {[{ key: "all", label: "Todos" }, { key: "pending", label: "Pendientes" }, { key: "approved", label: "Activos" }, { key: "hidden", label: "Ocultos" }].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className="px-3 py-1.5 rounded-lg font-body text-xs font-semibold"
            style={filter === f.key ? { background: "hsl(265 60% 55% / 0.2)", color: "hsl(265 60% 65%)" } : { background: "hsl(230 10% 14%)", color: "hsl(230 10% 50%)" }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="p-5 overflow-x-auto" style={cardStyle}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid hsl(230 10% 16%)" }}>
              {["Grupo", "Tipo", "Ciudad", "Precio/hr", "Membresía", "Estado", "Acciones"].map(h => (
                <th key={h} className="text-left py-2 px-2 font-body text-xs font-semibold" style={{ color: "hsl(230 10% 45%)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center font-body text-sm" style={{ color: "hsl(230 10% 40%)" }}>Sin grupos</td></tr>
            )}
            {filtered.map((p: any) => {
              const st = statusBadge(p.status);
              const membership = p.group_memberships?.[0];
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid hsl(230 10% 14%)" }}>
                  <td className="py-3 px-2 font-body text-sm font-semibold" style={{ color: "hsl(0 0% 90%)" }}>{p.group_name}</td>
                  <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 55%)" }}>{p.group_type}</td>
                  <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 55%)" }}>{p.city || "—"}</td>
                  <td className="py-3 px-2 font-body text-sm" style={{ color: "hsl(40 65% 55%)" }}>${Number(p.price_per_hour || 0).toLocaleString()}</td>
                  <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(265 60% 65%)" }}>{membership?.membership_plans?.name || "Sin plan"}</td>
                  <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-full font-body text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1">
                      {p.status === "pending" && (
                        <button onClick={() => updateStatus(p.id, "approved")} className="p-1.5 rounded-lg" style={{ background: "hsl(142 70% 45% / 0.15)" }}><Check className="w-3.5 h-3.5" style={{ color: "hsl(142 70% 55%)" }} /></button>
                      )}
                      {p.status === "approved" && (
                        <button onClick={() => updateStatus(p.id, "hidden")} className="p-1.5 rounded-lg" style={{ background: "hsl(0 70% 50% / 0.15)" }}><X className="w-3.5 h-3.5" style={{ color: "hsl(0 70% 60%)" }} /></button>
                      )}
                      {p.status === "hidden" && (
                        <button onClick={() => updateStatus(p.id, "approved")} className="p-1.5 rounded-lg" style={{ background: "hsl(142 70% 45% / 0.15)" }}><Eye className="w-3.5 h-3.5" style={{ color: "hsl(142 70% 55%)" }} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminGrupos;
