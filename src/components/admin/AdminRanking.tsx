import { useAdminBookings, useAdminGroupProfiles } from "@/hooks/useAdminData";

const cardStyle = { background: "hsl(230 15% 11%)", border: "1px solid hsl(230 10% 16%)", borderRadius: "16px" };

const AdminRanking = ({ password }: { password: string }) => {
  const { data: bookings } = useAdminBookings(password);
  const { data: profiles } = useAdminGroupProfiles(password);

  const groupStats: Record<string, { name: string; city: string; count: number; income: number }> = {};
  (bookings || []).forEach((b: any) => {
    if (!groupStats[b.group_profile_id]) {
      const gp = profiles?.find((p: any) => p.id === b.group_profile_id);
      groupStats[b.group_profile_id] = { name: gp?.group_name || "Desconocido", city: gp?.city || "—", count: 0, income: 0 };
    }
    groupStats[b.group_profile_id].count++;
    groupStats[b.group_profile_id].income += Number(b.total);
  });

  const ranked = Object.values(groupStats).sort((a, b) => b.count - a.count);
  const maxCount = ranked[0]?.count || 1;

  const medalColor = (i: number) => {
    if (i === 0) return "linear-gradient(135deg, hsl(40 80% 50%), hsl(40 60% 40%))";
    if (i === 1) return "linear-gradient(135deg, hsl(0 0% 75%), hsl(0 0% 55%))";
    if (i === 2) return "linear-gradient(135deg, hsl(25 60% 45%), hsl(25 40% 35%))";
    return "hsl(230 10% 18%)";
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-xl" style={{ color: "hsl(0 0% 95%)" }}>Ranking de Grupos</h2>

      {/* Top 3 podium */}
      {ranked.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[1, 0, 2].map(idx => {
            const g = ranked[idx];
            if (!g) return null;
            return (
              <div key={idx} className={`p-6 rounded-2xl text-center ${idx === 0 ? "md:-mt-4" : ""}`} style={{ ...cardStyle, borderColor: idx === 0 ? "hsl(40 65% 50% / 0.3)" : "hsl(230 10% 16%)" }}>
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-bold" style={{ background: medalColor(idx), color: idx < 3 ? "hsl(30 15% 10%)" : "hsl(230 10% 55%)" }}>
                  {idx + 1}
                </div>
                <p className="font-display font-bold text-sm" style={{ color: "hsl(0 0% 95%)" }}>{g.name}</p>
                <p className="font-body text-xs mt-1" style={{ color: "hsl(230 10% 50%)" }}>{g.city}</p>
                <p className="font-body text-sm font-semibold mt-2" style={{ color: "hsl(40 65% 55%)" }}>⭐ {g.count} eventos</p>
                <p className="font-body text-xs" style={{ color: "hsl(142 70% 55%)" }}>${g.income.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="p-5 overflow-x-auto" style={cardStyle}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid hsl(230 10% 16%)" }}>
              {["#", "Grupo", "Ciudad", "Eventos", "Ingresos", ""].map(h => (
                <th key={h} className="text-left py-2 px-2 font-body text-xs font-semibold" style={{ color: "hsl(230 10% 45%)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((g, i) => (
              <tr key={i} style={{ borderBottom: "1px solid hsl(230 10% 14%)" }}>
                <td className="py-3 px-2">
                  <span className="w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold"
                    style={{ background: i < 3 ? medalColor(i) : "hsl(230 10% 18%)", color: i < 3 ? "hsl(30 15% 10%)" : "hsl(230 10% 55%)" }}>{i + 1}</span>
                </td>
                <td className="py-3 px-2 font-body text-sm font-semibold" style={{ color: "hsl(0 0% 90%)" }}>{g.name}</td>
                <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 55%)" }}>{g.city}</td>
                <td className="py-3 px-2 font-body text-sm font-semibold" style={{ color: "hsl(40 65% 55%)" }}>{g.count}</td>
                <td className="py-3 px-2 font-body text-sm" style={{ color: "hsl(142 70% 55%)" }}>${g.income.toLocaleString()}</td>
                <td className="py-3 px-2">
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(230 10% 16%)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(g.count / maxCount) * 100}%`, background: "hsl(265 60% 55%)" }} />
                  </div>
                </td>
              </tr>
            ))}
            {ranked.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center font-body text-sm" style={{ color: "hsl(230 10% 40%)" }}>Sin datos de ranking</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRanking;
