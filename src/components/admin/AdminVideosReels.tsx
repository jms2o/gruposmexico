import { useAdminGroupMedia, useAdminContentSubmissions } from "@/hooks/useAdminData";
import { adminApi } from "@/lib/api";
import { Video, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const cardStyle = { background: "hsl(230 15% 11%)", border: "1px solid hsl(230 10% 16%)", borderRadius: "16px" };

const AdminVideosReels = ({ password }: { password: string }) => {
  const queryClient = useQueryClient();
  const { data: media, refetch: refetchMedia } = useAdminGroupMedia(password, "video");
  const { data: pendingVideos, refetch: refetchPending } = useAdminContentSubmissions(password, "pending");

  const videoSubmissions = pendingVideos?.filter((s: any) => s.type === "video") || [];

  const approve = async (id: string) => {
    try {
      await adminApi.call(password, { action: "update", table: "content_submissions", id, data: { status: "approved" } });
      toast.success("Video aprobado");
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const reject = async (id: string) => {
    try {
      await adminApi.call(password, { action: "update", table: "content_submissions", id, data: { status: "rejected" } });
      toast.success("Video rechazado");
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-xl" style={{ color: "hsl(0 0% 95%)" }}>Videos / Reels</h2>

      {/* Pending */}
      <div className="p-5" style={cardStyle}>
        <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2" style={{ color: "hsl(0 0% 95%)" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "hsl(0 70% 55%)" }} /> Pendientes de Aprobación ({videoSubmissions.length})
        </h3>
        <div className="space-y-3">
          {videoSubmissions.map((v: any) => (
            <div key={v.id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid hsl(230 10% 14%)" }}>
              <div>
                <p className="font-body text-sm" style={{ color: "hsl(0 0% 85%)" }}>{v.group_profiles?.group_name}</p>
                <p className="font-body text-xs" style={{ color: "hsl(230 10% 45%)" }}>{new Date(v.created_at).toLocaleDateString("es-MX")}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approve(v.id)} className="p-1.5 rounded-lg" style={{ background: "hsl(142 70% 45% / 0.15)" }}><Check className="w-4 h-4" style={{ color: "hsl(142 70% 55%)" }} /></button>
                <button onClick={() => reject(v.id)} className="p-1.5 rounded-lg" style={{ background: "hsl(0 70% 50% / 0.15)" }}><X className="w-4 h-4" style={{ color: "hsl(0 70% 60%)" }} /></button>
              </div>
            </div>
          ))}
          {videoSubmissions.length === 0 && <p className="font-body text-sm" style={{ color: "hsl(230 10% 40%)" }}>Sin videos pendientes</p>}
        </div>
      </div>

      {/* All videos */}
      <div className="p-5" style={cardStyle}>
        <h3 className="font-display font-bold text-base mb-4" style={{ color: "hsl(0 0% 95%)" }}>Todos los Videos ({media?.length || 0})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(media || []).slice(0, 12).map((v: any) => (
            <div key={v.id} className="rounded-xl overflow-hidden" style={{ background: "hsl(230 15% 13%)", border: "1px solid hsl(230 10% 18%)" }}>
              <div className="aspect-video bg-black flex items-center justify-center">
                <Video className="w-8 h-8" style={{ color: "hsl(230 10% 30%)" }} />
              </div>
              <div className="p-3">
                <p className="font-body text-sm font-semibold" style={{ color: "hsl(0 0% 85%)" }}>{v.title || "Sin título"}</p>
                <p className="font-body text-xs" style={{ color: "hsl(230 10% 45%)" }}>{v.group_profiles?.group_name}</p>
              </div>
            </div>
          ))}
          {(!media || media.length === 0) && <p className="font-body text-sm col-span-3" style={{ color: "hsl(230 10% 40%)" }}>Sin videos</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminVideosReels;
