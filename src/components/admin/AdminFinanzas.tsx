import { useAdminBookings, useAdminCommissions } from "@/hooks/useAdminData";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const cardStyle = { background: "hsl(230 15% 11%)", border: "1px solid hsl(230 10% 16%)", borderRadius: "16px" };

const AdminFinanzas = ({ password }: { password: string }) => {
  const { data: bookings } = useAdminBookings(password);
  const { data: commissions } = useAdminCommissions(password);

  const totalIncome = bookings?.reduce((s: number, b: any) => s + Number(b.total), 0) || 0;
  const totalCommissions = commissions?.reduce((s: number, c: any) => s + Number(c.amount), 0) || 0;
  const totalPayouts = bookings?.reduce((s: number, b: any) => s + Number(b.musician_earnings), 0) || 0;
  const pending = Math.max(0, totalIncome - totalPayouts - totalCommissions);

  // Monthly chart
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth(), y = d.getFullYear();
    const monthBookings = bookings?.filter((b: any) => { const bd = new Date(b.created_at || ""); return bd.getMonth() === m && bd.getFullYear() === y; }) || [];
    const monthIncome = monthBookings.reduce((s: number, b: any) => s + Number(b.total), 0);
    const monthComm = commissions?.filter((c: any) => c.period_month === m + 1 && c.period_year === y).reduce((s: number, c: any) => s + Number(c.amount), 0) || 0;
    return { name: d.toLocaleString("es-MX", { month: "short" }), ingresos: monthIncome, comisiones: monthComm };
  });

  const stats = [
    { label: "Ingresos Totales", value: `$${totalIncome.toLocaleString()}`, color: "hsl(142 70% 55%)", icon: TrendingUp },
    { label: "Comisiones", value: `$${totalCommissions.toLocaleString()}`, color: "hsl(265 60% 65%)", icon: DollarSign },
    { label: "Pagos a Grupos", value: `$${totalPayouts.toLocaleString()}`, color: "hsl(200 70% 60%)", icon: TrendingDown },
    { label: "Pendientes", value: `$${pending.toLocaleString()}`, color: "hsl(0 70% 60%)", icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-xl" style={{ color: "hsl(0 0% 95%)" }}>Finanzas</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="p-5 rounded-2xl" style={cardStyle}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-body text-xs" style={{ color: "hsl(230 10% 50%)" }}>{s.label}</p>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-display font-extrabold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="p-6" style={cardStyle}>
        <h3 className="font-display font-bold text-base mb-4" style={{ color: "hsl(0 0% 95%)" }}>Ingresos vs Comisiones (6 meses)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 10% 16%)" />
            <XAxis dataKey="name" tick={{ fill: "hsl(230 10% 45%)", fontSize: 12 }} axisLine={false} />
            <YAxis tick={{ fill: "hsl(230 10% 45%)", fontSize: 12 }} axisLine={false} />
            <Tooltip contentStyle={{ background: "hsl(230 15% 13%)", border: "1px solid hsl(230 10% 20%)", borderRadius: 12, color: "hsl(0 0% 90%)" }} />
            <Bar dataKey="ingresos" fill="hsl(142 70% 50%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="comisiones" fill="hsl(265 60% 55%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Commission history */}
      <div className="p-5 overflow-x-auto" style={cardStyle}>
        <h3 className="font-display font-bold text-base mb-4" style={{ color: "hsl(0 0% 95%)" }}>Historial de Comisiones</h3>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid hsl(230 10% 16%)" }}>
              {["ID", "Monto", "Tasa", "Período", "Estado"].map(h => (
                <th key={h} className="text-left py-2 px-2 font-body text-xs font-semibold" style={{ color: "hsl(230 10% 45%)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(commissions || []).length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center font-body text-sm" style={{ color: "hsl(230 10% 40%)" }}>Sin comisiones</td></tr>
            )}
            {(commissions || []).slice(0, 10).map((c: any) => (
              <tr key={c.id} style={{ borderBottom: "1px solid hsl(230 10% 14%)" }}>
                <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 50%)" }}>#{c.id.slice(0, 6)}</td>
                <td className="py-3 px-2 font-body text-sm font-semibold" style={{ color: "hsl(142 70% 55%)" }}>${Number(c.amount).toLocaleString()}</td>
                <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 55%)" }}>{c.commission_rate}%</td>
                <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 55%)" }}>{c.period_month}/{c.period_year}</td>
                <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-full font-body text-[11px] font-semibold" style={{ background: "hsl(142 70% 45% / 0.15)", color: "hsl(142 70% 55%)" }}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminFinanzas;
