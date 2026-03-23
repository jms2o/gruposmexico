import { useAdminGroupProfiles, useAdminBookings, useAdminEventRequests } from "@/hooks/useAdminData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const cardStyle = { background: "hsl(230 15% 11%)", border: "1px solid hsl(230 10% 16%)", borderRadius: "16px" };

const AdminReportes = ({ password }: { password: string }) => {
  const { data: profiles } = useAdminGroupProfiles(password);
  const { data: bookings } = useAdminBookings(password);
  const { data: requests } = useAdminEventRequests(password);

  // Group types distribution
  const typeCount: Record<string, number> = {};
  (profiles || []).forEach((p: any) => { typeCount[p.group_type] = (typeCount[p.group_type] || 0) + 1; });
  const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

  // Status distribution
  const statusCount: Record<string, number> = {};
  (bookings || []).forEach((b: any) => { statusCount[b.status] = (statusCount[b.status] || 0) + 1; });
  const statusData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  const colors = ["hsl(265 60% 55%)", "hsl(142 70% 50%)", "hsl(40 65% 50%)", "hsl(200 70% 55%)", "hsl(0 70% 55%)", "hsl(320 60% 55%)"];

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-xl" style={{ color: "hsl(0 0% 95%)" }}>Reportes</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Grupos", count: profiles?.length || 0, color: "hsl(265 60% 65%)" },
          { label: "Total Contrataciones", count: bookings?.length || 0, color: "hsl(142 70% 55%)" },
          { label: "Total Solicitudes", count: requests?.length || 0, color: "hsl(40 65% 55%)" },
        ].map(s => (
          <div key={s.label} className="p-5 rounded-2xl" style={cardStyle}>
            <p className="font-body text-xs mb-2" style={{ color: "hsl(230 10% 50%)" }}>{s.label}</p>
            <p className="text-3xl font-display font-extrabold" style={{ color: s.color }}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6" style={cardStyle}>
          <h3 className="font-display font-bold text-base mb-4" style={{ color: "hsl(0 0% 95%)" }}>Tipos de Grupo</h3>
          {typeData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {typeData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(230 15% 13%)", border: "1px solid hsl(230 10% 20%)", borderRadius: 12, color: "hsl(0 0% 90%)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {typeData.map((t, i) => (
                  <span key={t.name} className="flex items-center gap-1.5 font-body text-xs" style={{ color: "hsl(230 10% 60%)" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} /> {t.name} ({t.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="font-body text-sm text-center py-8" style={{ color: "hsl(230 10% 40%)" }}>Sin datos</p>
          )}
        </div>

        <div className="p-6" style={cardStyle}>
          <h3 className="font-display font-bold text-base mb-4" style={{ color: "hsl(0 0% 95%)" }}>Estados de Contratación</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {statusData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(230 15% 13%)", border: "1px solid hsl(230 10% 20%)", borderRadius: 12, color: "hsl(0 0% 90%)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {statusData.map((t, i) => (
                  <span key={t.name} className="flex items-center gap-1.5 font-body text-xs" style={{ color: "hsl(230 10% 60%)" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} /> {t.name} ({t.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="font-body text-sm text-center py-8" style={{ color: "hsl(230 10% 40%)" }}>Sin datos</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReportes;
