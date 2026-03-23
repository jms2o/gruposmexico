import { useAdminContentSubmissions } from "@/hooks/useAdminData";
import { adminApi } from "@/lib/api";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const cardStyle = { background: "hsl(230 15% 11%)", border: "1px solid hsl(230 10% 16%)", borderRadius: "16px" };

const AdminModeracion = ({ password }: { password: string }) => {
  const queryClient = useQueryClient();
  const { data: submissions, refetch } = useAdminContentSubmissions(password);

  const pending = submissions?.filter((s: any) => s.status === "pending") || [];
  const videos = pending.filter((s: any) => s.type === "video");
  const photos = pending.filter((s: any) => s.type === "photo" || s.type === "main_photo");
  const others = pending.filter((s: any) => !["video", "photo", "main_photo"].includes(s.type));

  const update = async (id: string, status: string) => {
    try {
      await adminApi.call(password, { action: "update", table: "content_submissions", id, data: { status } });
      toast.success(status === "approved" ? "Aprobado" : "Rechazado");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const Section = ({ title, items, color }: { title: string; items: any[]; color: string }) => (
    <div className="p-5" style={cardStyle}>
      <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2" style={{ color: "hsl(0 0% 95%)" }}>
        <span className="w-2 h-2 rounded-full" style={{ background: color }} /> {title} ({items.length})
      </h3>
      <div className="space-y-3">
        {items.map((s: any) => (
          <div key={s.id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid hsl(230 10% 14%)" }}>
            <div>
              <p className="font-body text-sm" style={{ color: "hsl(0 0% 85%)" }}>{s.group_profiles?.group_name} — <span className="capitalize">{s.type}</span></p>
              <p className="font-body text-xs" style={{ color: "hsl(230 10% 45%)" }}>{new Date(s.created_at).toLocaleDateString("es-MX")}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => update(s.id, "approved")} className="p-1.5 rounded-lg" style={{ background: "hsl(142 70% 45% / 0.15)" }}><Check className="w-4 h-4" style={{ color: "hsl(142 70% 55%)" }} /></button>
              <button onClick={() => update(s.id, "rejected")} className="p-1.5 rounded-lg" style={{ background: "hsl(0 70% 50% / 0.15)" }}><X className="w-4 h-4" style={{ color: "hsl(0 70% 60%)" }} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="font-body text-sm" style={{ color: "hsl(230 10% 40%)" }}>Sin elementos pendientes</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-xl" style={{ color: "hsl(0 0% 95%)" }}>Moderación</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Videos Pendientes", count: videos.length, color: "hsl(0 70% 55%)" },
          { label: "Fotos Pendientes", count: photos.length, color: "hsl(40 65% 55%)" },
          { label: "Otros Pendientes", count: others.length, color: "hsl(200 70% 55%)" },
        ].map(s => (
          <div key={s.label} className="p-5 rounded-2xl" style={cardStyle}>
            <p className="font-body text-xs mb-2" style={{ color: "hsl(230 10% 50%)" }}>{s.label}</p>
            <p className="text-3xl font-display font-extrabold" style={{ color: s.color }}>{s.count}</p>
          </div>
        ))}
      </div>

      <Section title="Videos Pendientes" items={videos} color="hsl(0 70% 55%)" />
      <Section title="Fotos Pendientes" items={photos} color="hsl(40 65% 55%)" />
      <Section title="Otros Contenidos" items={others} color="hsl(200 70% 55%)" />
    </div>
  );
};

export default AdminModeracion;
