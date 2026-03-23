import { useAdminGroupProfiles, useAdminUserRoles } from "@/hooks/useAdminData";

const cardStyle = { background: "hsl(230 15% 11%)", border: "1px solid hsl(230 10% 16%)", borderRadius: "16px" };

const AdminUsuarios = ({ password }: { password: string }) => {
  const { data: profiles } = useAdminGroupProfiles(password);
  const { data: roles } = useAdminUserRoles(password);

  const admins = roles?.filter((r: any) => r.role === "admin") || [];
  const groups = roles?.filter((r: any) => r.role === "group") || [];

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-xl" style={{ color: "hsl(0 0% 95%)" }}>Usuarios</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Administradores", count: admins.length, color: "hsl(265 60% 55%)" },
          { label: "Músicos (Grupos)", count: groups.length, color: "hsl(40 65% 50%)" },
          { label: "Total Perfiles", count: profiles?.length || 0, color: "hsl(200 70% 55%)" },
        ].map(s => (
          <div key={s.label} className="p-5 rounded-2xl" style={cardStyle}>
            <p className="font-body text-xs mb-2" style={{ color: "hsl(230 10% 50%)" }}>{s.label}</p>
            <p className="text-3xl font-display font-extrabold" style={{ color: s.color }}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="p-5 overflow-x-auto" style={cardStyle}>
        <h3 className="font-display font-bold text-base mb-4" style={{ color: "hsl(0 0% 95%)" }}>Perfiles de Grupos</h3>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid hsl(230 10% 16%)" }}>
              {["Nombre", "Tipo", "Estado", "Ciudad", "Teléfono", "Registro"].map(h => (
                <th key={h} className="text-left py-2 px-2 font-body text-xs font-semibold" style={{ color: "hsl(230 10% 45%)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(profiles || []).length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center font-body text-sm" style={{ color: "hsl(230 10% 40%)" }}>Sin usuarios</td></tr>
            )}
            {(profiles || []).map((p: any) => (
              <tr key={p.id} style={{ borderBottom: "1px solid hsl(230 10% 14%)" }}>
                <td className="py-3 px-2 font-body text-sm font-semibold" style={{ color: "hsl(0 0% 90%)" }}>{p.group_name}</td>
                <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 55%)" }}>{p.group_type}</td>
                <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-full font-body text-[11px] font-semibold"
                  style={p.status === "approved" ? { background: "hsl(142 70% 45% / 0.15)", color: "hsl(142 70% 55%)" } : { background: "hsl(40 65% 50% / 0.15)", color: "hsl(40 65% 60%)" }}>
                  {p.status}</span></td>
                <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 55%)" }}>{p.city || "—"}</td>
                <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 55%)" }}>{p.phone || "—"}</td>
                <td className="py-3 px-2 font-body text-xs" style={{ color: "hsl(230 10% 45%)" }}>{new Date(p.created_at).toLocaleDateString("es-MX")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsuarios;
