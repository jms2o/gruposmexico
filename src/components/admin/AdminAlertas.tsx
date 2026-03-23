import { useAdminNotifications } from "@/hooks/useAdminData";
import { adminApi } from "@/lib/api";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const cardStyle = { background: "hsl(230 15% 11%)", border: "1px solid hsl(230 10% 16%)", borderRadius: "16px" };

const AdminAlertas = ({ password }: { password: string }) => {
  const queryClient = useQueryClient();
  const { data: notifications, refetch } = useAdminNotifications(password);

  const markRead = async (id: string) => {
    try {
      await adminApi.call(password, { action: "update", table: "admin_notifications", id, data: { read: true } });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-unread-count"] });
    } catch {}
  };

  const markAllRead = async () => {
    try {
      const unread = (notifications || []).filter((n: any) => !n.read);
      for (const n of unread) {
        await adminApi.call(password, { action: "update", table: "admin_notifications", id: n.id, data: { read: true } });
      }
      toast.success("Todas marcadas como leídas");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-unread-count"] });
    } catch {}
  };

  const unread = (notifications || []).filter((n: any) => !n.read);

  const typeColor = (type: string) => {
    if (type === "new_registration") return "hsl(142 70% 50%)";
    if (type === "content_submission") return "hsl(40 65% 55%)";
    if (type === "event_request") return "hsl(265 60% 65%)";
    return "hsl(200 70% 55%)";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl" style={{ color: "hsl(0 0% 95%)" }}>Alertas</h2>
        {unread.length > 0 && (
          <button onClick={markAllRead} className="px-4 py-2 rounded-xl font-body text-xs font-semibold" style={{ background: "hsl(265 60% 55% / 0.15)", color: "hsl(265 60% 65%)" }}>
            Marcar todas leídas ({unread.length})
          </button>
        )}
      </div>

      <div className="space-y-2">
        {(notifications || []).map((n: any) => (
          <div key={n.id} className="p-4 rounded-xl flex items-center justify-between"
            style={{ ...cardStyle, borderColor: !n.read ? typeColor(n.type) + "44" : "hsl(230 10% 16%)" }}>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: !n.read ? typeColor(n.type) : "hsl(230 10% 25%)" }} />
              <div>
                <p className="font-body text-sm font-semibold" style={{ color: "hsl(0 0% 90%)" }}>{n.title}</p>
                <p className="font-body text-xs" style={{ color: "hsl(230 10% 45%)" }}>
                  {n.message} · {n.group_profiles?.group_name || ""} · {new Date(n.created_at).toLocaleDateString("es-MX")}
                </p>
              </div>
            </div>
            {!n.read && (
              <button onClick={() => markRead(n.id)} className="px-3 py-1 rounded-lg font-body text-xs" style={{ background: "hsl(230 10% 16%)", color: "hsl(230 10% 60%)" }}>Leída</button>
            )}
          </div>
        ))}
        {(!notifications || notifications.length === 0) && (
          <div className="p-8 text-center" style={cardStyle}>
            <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: "hsl(230 10% 25%)" }} />
            <p className="font-body text-sm" style={{ color: "hsl(230 10% 40%)" }}>Sin alertas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAlertas;
