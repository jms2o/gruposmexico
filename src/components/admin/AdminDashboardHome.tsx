import { useAdminBookings, useAdminGroupProfiles, useAdminEventRequests, useAdminMemberships, useAdminCommissions, useAdminContentSubmissions } from "@/hooks/useAdminData";
import { CalendarDays, DollarSign, Music, FileText, Crown, MapPin } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const cardStyle = {
  background: "hsl(230 15% 11%)",
  border: "1px solid hsl(230 10% 16%)",
  borderRadius: "16px",
};

const AdminDashboardHome = ({ password }: { password: string }) => {
  const { data: bookings } = useAdminBookings(password);
  const { data: groupProfiles } = useAdminGroupProfiles(password);
  const { data: eventRequests } = useAdminEventRequests(password);
  const { data: memberships } = useAdminMemberships(password);
  const { data: commissions } = useAdminCommissions(password);
  const { data: pendingSubmissions } = useAdminContentSubmissions(password, "pending");

  const today = new Date().toISOString().split("T")[0];
  const todayBookings = bookings?.filter((b: any) => b.event_date?.startsWith(today)) || [];
  const activeGroups = groupProfiles?.filter((p: any) => p.status === "approved") || [];
  const pendingRequests = eventRequests?.filter((r: any) => r.status === "open") || [];
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthCommissions = commissions?.filter((c: any) => c.period_month === thisMonth + 1 && c.period_year === thisYear) || [];
  const totalMonthCommission = monthCommissions.reduce((sum: number, c: any) => sum + Number(c.amount), 0);
  const todayIncome = todayBookings.reduce((sum: number, b: any) => sum + Number(b.total), 0);

  // Chart data - last 6 months
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthRequests = eventRequests?.filter((r: any) => {
      const rd = new Date(r.created_at);
      return rd.getMonth() === month && rd.getFullYear() === year;
    }) || [];
    const monthBookingsConfirmed = bookings?.filter((b: any) => {
      const bd = new Date(b.created_at || "");
      return bd.getMonth() === month && bd.getFullYear() === year && b.status === "confirmed";
    }) || [];
    const monthBookingsDone = bookings?.filter((b: any) => {
      const bd = new Date(b.created_at || "");
      return bd.getMonth() === month && bd.getFullYear() === year && b.status === "completed";
    }) || [];
    const monthBookingsCancelled = bookings?.filter((b: any) => {
      const bd = new Date(b.created_at || "");
      return bd.getMonth() === month && bd.getFullYear() === year && b.status === "cancelled";
    }) || [];
    return {
      name: d.toLocaleString("es-MX", { month: "short" }).charAt(0).toUpperCase() + d.toLocaleString("es-MX", { month: "short" }).slice(1),
      solicitudes: monthRequests.length,
      confirmados: monthBookingsConfirmed.length,
      realizados: monthBookingsDone.length,
      cancelados: monthBookingsCancelled.length,
    };
  });

  // Groups by city
  const cities = ["CDMX", "Guadalajara", "Monterrey", "Mazatlán", "Culiacán"];
  const cityColors = ["hsl(220 70% 55%)", "hsl(40 65% 50%)", "hsl(265 60% 55%)", "hsl(142 70% 45%)", "hsl(0 70% 55%)"];
  const cityCounts = cities.map(c => ({
    city: c,
    count: groupProfiles?.filter((p: any) => p.city?.toLowerCase() === c.toLowerCase()).length || 0,
  }));

  // Latest bookings for table
  const latestBookings = (bookings || []).slice(0, 5);

  // Finance summary
  const totalIncome = bookings?.reduce((sum: number, b: any) => sum + Number(b.total), 0) || 0;
  const totalCommissions = commissions?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0;
  const totalPayouts = bookings?.reduce((sum: number, b: any) => sum + Number(b.musician_earnings), 0) || 0;

  // Moderation
  const pendingVideos = pendingSubmissions?.filter((s: any) => s.type === "video") || [];
  const pendingPhotos = pendingSubmissions?.filter((s: any) => s.type === "photo" || s.type === "main_photo") || [];

  // Top groups
  const groupBookingCounts: Record<string, { name: string; count: number }> = {};
  (bookings || []).forEach((b: any) => {
    if (!groupBookingCounts[b.group_profile_id]) {
      const gp = groupProfiles?.find((p: any) => p.id === b.group_profile_id);
      groupBookingCounts[b.group_profile_id] = { name: gp?.group_name || "Desconocido", count: 0 };
    }
    groupBookingCounts[b.group_profile_id].count++;
  });
  const topGroups = Object.values(groupBookingCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  const statCards = [
    { label: "Eventos Hoy", value: todayBookings.length, sub: "Programados", icon: CalendarDays, color: "hsl(265 60% 55%)", gradient: "linear-gradient(135deg, hsl(265 60% 55% / 0.15), hsl(265 60% 55% / 0.05))" },
    { label: "Ingresos del Día", value: `$${todayIncome.toLocaleString()}`, sub: "MXN", icon: DollarSign, color: "hsl(142 70% 50%)", gradient: "linear-gradient(135deg, hsl(142 70% 50% / 0.15), hsl(142 70% 50% / 0.05))" },
    { label: "Grupos Activos", value: activeGroups.length, sub: `+ ${groupProfiles?.filter((p: any) => { const d = new Date(p.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length || 0} Nuevos`, icon: Music, color: "hsl(40 65% 50%)", gradient: "linear-gradient(135deg, hsl(40 65% 50% / 0.15), hsl(40 65% 50% / 0.05))" },
    { label: "Solicitudes Pendientes", value: pendingRequests.length, sub: "Ver lista →", icon: FileText, color: "hsl(200 70% 55%)", gradient: "linear-gradient(135deg, hsl(200 70% 55% / 0.15), hsl(200 70% 55% / 0.05))" },
    { label: "Comisiones del Mes", value: `$${totalMonthCommission.toLocaleString()}`, sub: "MXN este mes", icon: Crown, color: "hsl(0 70% 55%)", gradient: "linear-gradient(135deg, hsl(0 70% 55% / 0.15), hsl(0 70% 55% / 0.05))" },
  ];

  const statusColor = (s: string) => {
    if (s === "confirmed") return { bg: "hsl(142 70% 45% / 0.15)", color: "hsl(142 70% 55%)", label: "Confirmado" };
    if (s === "pending") return { bg: "hsl(40 65% 50% / 0.15)", color: "hsl(40 65% 60%)", label: "En Negociación" };
    if (s === "completed") return { bg: "hsl(200 70% 55% / 0.15)", color: "hsl(200 70% 60%)", label: "Realizado" };
    if (s === "cancelled") return { bg: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 60%)", label: "Cancelado" };
    return { bg: "hsl(230 10% 20%)", color: "hsl(230 10% 60%)", label: s };
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="p-5 rounded-2xl relative overflow-hidden" style={{ ...cardStyle, background: s.gradient }}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-xs" style={{ color: "hsl(230 10% 55%)" }}>{s.label}</p>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <p className="text-2xl md:text-3xl font-display font-extrabold" style={{ color: "hsl(0 0% 95%)" }}>{s.value}</p>
            <p className="text-xs font-body mt-1" style={{ color: s.color }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 p-6" style={cardStyle}>
          <h3 className="font-display font-bold text-base mb-1" style={{ color: "hsl(0 0% 95%)" }}>Actividad de Eventos</h3>
          <p className="font-body text-xs mb-4" style={{ color: "hsl(230 10% 45%)" }}>Últimos 6 Meses</p>
          <div className="flex flex-wrap gap-4 mb-4">
            {[
              { label: "Solicitudes", color: "hsl(200 70% 55%)" },
              { label: "Confirmados", color: "hsl(142 70% 50%)" },
              { label: "Realizados", color: "hsl(265 60% 55%)" },
              { label: "Cancelados", color: "hsl(0 70% 55%)" },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 font-body text-xs" style={{ color: "hsl(230 10% 60%)" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: l.color }} /> {l.label}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSol" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(200 70% 55%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(200 70% 55%)" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(142 70% 50%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(142 70% 50%)" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(265 60% 55%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(265 60% 55%)" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorCanc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(0 70% 55%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(0 70% 55%)" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 10% 16%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(230 10% 45%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(230 10% 45%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(230 15% 13%)", border: "1px solid hsl(230 10% 20%)", borderRadius: 12, color: "hsl(0 0% 90%)" }} />
              <Area type="monotone" dataKey="solicitudes" stroke="hsl(200 70% 55%)" fill="url(#colorSol)" strokeWidth={2} />
              <Area type="monotone" dataKey="confirmados" stroke="hsl(142 70% 50%)" fill="url(#colorConf)" strokeWidth={2} />
              <Area type="monotone" dataKey="realizados" stroke="hsl(265 60% 55%)" fill="url(#colorReal)" strokeWidth={2} />
              <Area type="monotone" dataKey="cancelados" stroke="hsl(0 70% 55%)" fill="url(#colorCanc)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cities */}
        <div className="p-6" style={cardStyle}>
          <h3 className="font-display font-bold text-base mb-4" style={{ color: "hsl(0 0% 95%)" }}>Grupos por Ciudad</h3>
          <div className="space-y-4">
            {cityCounts.map((c, i) => (
              <div key={c.city} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4" style={{ color: cityColors[i] }} />
                  <span className="font-body text-sm" style={{ color: "hsl(0 0% 85%)" }}>{c.city}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(230 10% 16%)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (c.count / Math.max(1, ...cityCounts.map(cc => cc.count))) * 100)}%`, background: cityColors[i] }} />
                  </div>
                  <span className="font-display font-bold text-sm w-8 text-right" style={{ color: "hsl(0 0% 90%)" }}>{c.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table + Finance + Moderation + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest bookings table */}
        <div className="lg:col-span-2 p-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base" style={{ color: "hsl(0 0% 95%)" }}>Últimas Contrataciones</h3>
            <span className="font-body text-xs font-semibold" style={{ color: "hsl(265 60% 65%)" }}>Ver Todas »</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid hsl(230 10% 16%)" }}>
                  {["ID", "Cliente", "Grupo", "Ciudad", "Fecha", "Precio", "Estado"].map(h => (
                    <th key={h} className="text-left py-2 px-2 font-body text-xs font-semibold" style={{ color: "hsl(230 10% 45%)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {latestBookings.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center font-body text-sm" style={{ color: "hsl(230 10% 40%)" }}>Sin contrataciones aún</td></tr>
                )}
                {latestBookings.map((b: any) => {
                  const st = statusColor(b.status);
                  return (
                    <tr key={b.id} style={{ borderBottom: "1px solid hsl(230 10% 14%)" }}>
                      <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 50%)" }}>#{b.id.slice(0, 6)}</td>
                      <td className="py-3 px-2 font-body text-sm" style={{ color: "hsl(0 0% 85%)" }}>{b.client_name}</td>
                      <td className="py-3 px-2 font-body text-sm" style={{ color: "hsl(0 0% 85%)" }}>{b.group_profiles?.group_name || "—"}</td>
                      <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 55%)" }}>{b.group_profiles?.city || "—"}</td>
                      <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 55%)" }}>{new Date(b.event_date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</td>
                      <td className="py-3 px-2 font-body text-sm font-semibold" style={{ color: "hsl(0 0% 90%)" }}>${Number(b.total).toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <span className="px-2.5 py-1 rounded-full font-body text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Finance */}
          <div className="p-6" style={cardStyle}>
            <h3 className="font-display font-bold text-base mb-4" style={{ color: "hsl(0 0% 95%)" }}>Finanzas</h3>
            <div className="space-y-3">
              {[
                { label: "Ingresos:", value: `$${totalIncome.toLocaleString()}`, color: "hsl(142 70% 55%)" },
                { label: "Comisiones:", value: `$${totalCommissions.toLocaleString()}`, color: "hsl(265 60% 65%)" },
                { label: "Pagos a Grupos:", value: `$${totalPayouts.toLocaleString()}`, color: "hsl(200 70% 60%)" },
                { label: "Pendientes:", value: `$${Math.max(0, totalIncome - totalPayouts - totalCommissions).toLocaleString()}`, color: "hsl(0 70% 60%)" },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between">
                  <span className="font-body text-sm" style={{ color: "hsl(230 10% 55%)" }}>{f.label}</span>
                  <span className="font-display font-bold text-lg" style={{ color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Moderation */}
          <div className="p-6" style={cardStyle}>
            <h3 className="font-display font-bold text-base mb-4" style={{ color: "hsl(0 0% 95%)" }}>Moderación</h3>
            <div className="space-y-3">
              {[
                { label: `${pendingVideos.length} Videos Pendientes`, color: "hsl(0 70% 55%)" },
                { label: `${pendingPhotos.length} Fotos Reportadas`, color: "hsl(40 65% 55%)" },
                { label: `${pendingSubmissions?.length || 0} Contenido en Revisión`, color: "hsl(200 70% 55%)" },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-body text-sm" style={{ color: "hsl(0 0% 85%)" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: m.color }} /> {m.label}
                  </span>
                  <button className="font-body text-xs px-3 py-1 rounded-lg" style={{ background: "hsl(230 10% 16%)", color: "hsl(230 10% 60%)" }}>Revisar</button>
                </div>
              ))}
            </div>
          </div>

          {/* Ranking */}
          <div className="p-6" style={cardStyle}>
            <h3 className="font-display font-bold text-base mb-4" style={{ color: "hsl(0 0% 95%)" }}>Top Grupos</h3>
            <div className="space-y-3">
              {topGroups.length === 0 && <p className="font-body text-sm" style={{ color: "hsl(230 10% 40%)" }}>Sin datos</p>}
              {topGroups.map((g, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: i === 0 ? "hsl(40 65% 50%)" : i === 1 ? "hsl(0 0% 65%)" : i === 2 ? "hsl(25 50% 45%)" : "hsl(230 10% 18%)", color: i < 3 ? "hsl(30 15% 10%)" : "hsl(230 10% 55%)" }}>
                      {i + 1}
                    </span>
                    <span className="font-body text-sm" style={{ color: "hsl(0 0% 85%)" }}>{g.name}</span>
                  </div>
                  <span className="font-display font-bold text-sm" style={{ color: "hsl(40 65% 55%)" }}>{g.count} eventos</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
