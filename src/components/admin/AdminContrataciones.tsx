import { useAdminBookings, useAdminProposals } from "@/hooks/useAdminData";
import { Search } from "lucide-react";
import { useState } from "react";

const cardStyle = { background: "hsl(230 15% 11%)", border: "1px solid hsl(230 10% 16%)", borderRadius: "16px" };

const AdminContrataciones = ({ password }: { password: string }) => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: bookings } = useAdminBookings(password);
  const { data: proposals } = useAdminProposals(password);

  const filtered = (bookings || []).filter((b: any) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (search && !b.client_name?.toLowerCase().includes(search.toLowerCase()) && !b.group_profiles?.group_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusColor = (s: string) => {
    if (s === "confirmed") return { bg: "hsl(142 70% 45% / 0.15)", color: "hsl(142 70% 55%)", label: "Confirmado" };
    if (s === "pending") return { bg: "hsl(40 65% 50% / 0.15)", color: "hsl(40 65% 60%)", label: "Pendiente" };
    if (s === "completed") return { bg: "hsl(200 70% 55% / 0.15)", color: "hsl(200 70% 60%)", label: "Realizado" };
    if (s === "cancelled") return { bg: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 60%)", label: "Cancelado" };
    return { bg: "hsl(230 10% 20%)", color: "hsl(230 10% 60%)", label: s };
  };

  const filters = [
    { key: "all", label: "Todas" },
    { key: "pending", label: "Pendientes" },
    { key: "confirmed", label: "Confirmadas" },
    { key: "completed", label: "Realizadas" },
    { key: "cancelled", label: "Canceladas" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl" style={{ color: "hsl(0 0% 95%)" }}>Contrataciones</h2>
        <span className="font-body text-sm" style={{ color: "hsl(230 10% 45%)" }}>{bookings?.length || 0} total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "hsl(230 15% 13%)", border: "1px solid hsl(230 10% 18%)" }}>
          <Search className="w-4 h-4" style={{ color: "hsl(230 10% 40%)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente o grupo..." className="bg-transparent outline-none font-body text-sm w-48" style={{ color: "hsl(0 0% 85%)" }} />
        </div>
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className="px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all"
            style={filter === f.key ? { background: "hsl(265 60% 55% / 0.2)", color: "hsl(265 60% 65%)" } : { background: "hsl(230 10% 14%)", color: "hsl(230 10% 50%)" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="p-5 overflow-x-auto" style={cardStyle}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid hsl(230 10% 16%)" }}>
              {["ID", "Cliente", "Grupo", "Ciudad", "Fecha", "Horas", "Precio", "Comisión", "Estado"].map(h => (
                <th key={h} className="text-left py-2 px-2 font-body text-xs font-semibold" style={{ color: "hsl(230 10% 45%)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="py-8 text-center font-body text-sm" style={{ color: "hsl(230 10% 40%)" }}>Sin contrataciones</td></tr>
            )}
            {filtered.map((b: any) => {
              const st = statusColor(b.status);
              return (
                <tr key={b.id} style={{ borderBottom: "1px solid hsl(230 10% 14%)" }}>
                  <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 50%)" }}>#{b.id.slice(0, 6)}</td>
                  <td className="py-3 px-2 font-body text-sm" style={{ color: "hsl(0 0% 85%)" }}>{b.client_name}</td>
                  <td className="py-3 px-2 font-body text-sm" style={{ color: "hsl(0 0% 85%)" }}>{b.group_profiles?.group_name || "—"}</td>
                  <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 55%)" }}>{b.group_profiles?.city || "—"}</td>
                  <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 55%)" }}>{new Date(b.event_date).toLocaleDateString("es-MX")}</td>
                  <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 55%)" }}>{b.hours}h</td>
                  <td className="py-3 px-2 font-body text-sm font-semibold" style={{ color: "hsl(0 0% 90%)" }}>${Number(b.total).toLocaleString()}</td>
                  <td className="py-3 px-2 font-body text-sm" style={{ color: "hsl(265 60% 65%)" }}>${Number(b.commission_amount).toLocaleString()}</td>
                  <td className="py-3 px-2"><span className="px-2.5 py-1 rounded-full font-body text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Proposals */}
      <div className="p-5" style={cardStyle}>
        <h3 className="font-display font-bold text-base mb-4" style={{ color: "hsl(0 0% 95%)" }}>Propuestas Recientes</h3>
        <div className="space-y-3">
          {(proposals || []).slice(0, 10).map((p: any) => {
            const st = statusColor(p.status === "accepted" ? "confirmed" : p.status === "confirmed" ? "pending" : p.status);
            return (
              <div key={p.id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid hsl(230 10% 14%)" }}>
                <div>
                  <p className="font-body text-sm" style={{ color: "hsl(0 0% 85%)" }}>{p.group_profiles?.group_name} → {p.event_requests?.client_name}</p>
                  <p className="font-body text-xs" style={{ color: "hsl(230 10% 45%)" }}>{p.event_requests?.event_type} · {p.event_requests?.city}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full font-body text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
              </div>
            );
          })}
          {(!proposals || proposals.length === 0) && <p className="font-body text-sm" style={{ color: "hsl(230 10% 40%)" }}>Sin propuestas</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminContrataciones;
