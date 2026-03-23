import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/api";
import { Users, Search, Eye, Edit, Crown, Ban, Trash2, RefreshCw, MapPin } from "lucide-react";
import { ESTADOS_CIUDADES, ESTADOS } from "@/lib/locationData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ProfilePreview from "./ProfilePreview";

const MusiciansPanel = ({ password }: { password: string }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMembership, setFilterMembership] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [locState, setLocState] = useState("Sinaloa");
  const [locCity, setLocCity] = useState("Mazatlán");

  const { data: profiles, refetch } = useQuery({
    queryKey: ["admin-musicians"],
    queryFn: async () => {
      const { data } = await supabase.from("group_profiles").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: memberships } = useQuery({
    queryKey: ["admin-all-memberships"],
    queryFn: async () => {
      const { data } = await supabase.from("group_memberships").select("*, membership_plans(name, tier, commission_rate)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const getMembership = (profileId: string) => {
    return memberships?.find((m: any) => m.group_profile_id === profileId && m.status === "active");
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminApi.call(password, { action: "update", table: "group_profiles", id, data: { status } });
      toast.success(`Estado cambiado a ${status}`);
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteProfile = async (id: string) => {
    if (!confirm("¿Eliminar este músico permanentemente? Esta acción no se puede deshacer.")) return;
    try {
      await adminApi.call(password, { action: "delete", table: "group_profiles", id });
      toast.success("Perfil eliminado");
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const renewMembership = async (profileId: string) => {
    const membership = getMembership(profileId);
    if (!membership) {
      toast.error("No tiene membresía activa para renovar");
      return;
    }
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    try {
      await adminApi.call(password, {
        action: "update", table: "group_memberships", id: membership.id,
        data: { expires_at: expiresAt.toISOString(), status: "active" },
      });
      toast.success("Membresía renovada por 1 mes");
      queryClient.invalidateQueries({ queryKey: ["admin-all-memberships"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const saveNotes = async (id: string) => {
    try {
      await adminApi.call(password, { action: "update", table: "group_profiles", id, data: { admin_notes: notesValue } });
      toast.success("Notas guardadas");
      setEditingNotes(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const saveLocation = async (id: string) => {
    try {
      await adminApi.call(password, { action: "update", table: "group_profiles", id, data: { state: locState, city: locCity } });
      // Also sync to musical_groups
      const { data: mg } = await supabase.from("musical_groups").select("id").eq("group_profile_id", id).maybeSingle();
      if (mg) {
        await adminApi.call(password, { action: "update", table: "musical_groups", id: mg.id, data: { state: locState, city: locCity } });
      }
      toast.success("Ubicación actualizada");
      setEditingLocation(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = (profiles || []).filter((p: any) => {
    if (search && !p.group_name.toLowerCase().includes(search.toLowerCase()) && !p.phone?.includes(search)) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterMembership === "active" && !getMembership(p.id)) return false;
    if (filterMembership === "none" && getMembership(p.id)) return false;
    if (filterCategory !== "all" && p.group_type !== filterCategory) return false;
    return true;
  });

  if (previewId) {
    return (
      <div>
        <button onClick={() => setPreviewId(null)} className="mb-4 px-4 py-2 rounded-xl bg-muted text-foreground font-body text-sm hover:bg-border">
          ← Volver a gestión de músicos
        </button>
        <ProfilePreview profileId={previewId} />
      </div>
    );
  }

  const statusOptions = ["all", "pending", "approved", "hidden", "rejected", "suspended"];
  const categoryOptions = ["all", "Mariachi", "DJ", "Versátil", "Sierreño", "Banda Sinaloense", "Norteño"];

  return (
    <div>
      <h3 className="font-display font-bold text-foreground text-xl mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-gold" /> Gestión de músicos
      </h3>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground font-body text-sm">
          {statusOptions.map((s) => <option key={s} value={s}>{s === "all" ? "Todos los estados" : s}</option>)}
        </select>
        <select value={filterMembership} onChange={(e) => setFilterMembership(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground font-body text-sm">
          <option value="all">Todas las membresías</option>
          <option value="active">Con membresía activa</option>
          <option value="none">Sin membresía</option>
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground font-body text-sm">
          {categoryOptions.map((c) => <option key={c} value={c}>{c === "all" ? "Todas las categorías" : c}</option>)}
        </select>
      </div>

      <p className="text-sm font-body text-muted-foreground mb-4">{filtered.length} músicos encontrados</p>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 font-body font-semibold text-muted-foreground">Nombre</th>
              <th className="text-left py-3 px-2 font-body font-semibold text-muted-foreground">Categoría</th>
              <th className="text-left py-3 px-2 font-body font-semibold text-muted-foreground">Ubicación</th>
              <th className="text-left py-3 px-2 font-body font-semibold text-muted-foreground">Teléfono</th>
              <th className="text-left py-3 px-2 font-body font-semibold text-muted-foreground">Membresía</th>
              <th className="text-left py-3 px-2 font-body font-semibold text-muted-foreground">Vencimiento</th>
              <th className="text-left py-3 px-2 font-body font-semibold text-muted-foreground">Estado</th>
              <th className="text-right py-3 px-2 font-body font-semibold text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: any) => {
              const mem = getMembership(p.id);
              const memPlan = mem ? (mem as any).membership_plans : null;
              return (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-body font-semibold text-foreground">{p.group_name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-2 font-body text-foreground">{p.group_type}</td>
                  <td className="py-3 px-2">
                    <p className="font-body text-xs text-foreground">{p.state || "—"}</p>
                    <p className="font-body text-xs text-muted-foreground">{p.city || "—"}</p>
                  </td>
                  <td className="py-3 px-2 font-body text-muted-foreground">{p.phone || "—"}</td>
                  <td className="py-3 px-2">
                    {memPlan ? (
                      <span className="px-2 py-1 rounded-lg bg-gold/20 text-gold text-xs font-bold">{memPlan.name}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Sin plan</span>
                    )}
                  </td>
                  <td className="py-3 px-2 font-body text-xs text-muted-foreground">
                    {mem?.expires_at ? new Date(mem.expires_at).toLocaleDateString("es-MX") : "—"}
                  </td>
                  <td className="py-3 px-2">
                    <span className={cn("px-2 py-1 rounded-lg font-body text-xs font-bold",
                      p.status === "pending" && "bg-gold/20 text-gold",
                      p.status === "approved" && "bg-primary/20 text-primary",
                      p.status === "hidden" && "bg-muted text-muted-foreground",
                      p.status === "suspended" && "bg-destructive/20 text-destructive",
                      p.status === "rejected" && "bg-destructive/20 text-destructive")}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1 justify-end flex-wrap">
                      <button onClick={() => setPreviewId(p.id)} title="Ver perfil"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingNotes(p.id); setNotesValue(p.admin_notes || ""); }} title="Notas"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingLocation(p.id); setLocState(p.state || "Sinaloa"); setLocCity(p.city || "Mazatlán"); }} title="Ubicación"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                        <MapPin className="w-4 h-4" />
                      </button>
                      <button onClick={() => renewMembership(p.id)} title="Renovar membresía"
                        className="p-1.5 rounded-lg hover:bg-muted text-gold">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      {p.status !== "suspended" ? (
                        <button onClick={() => updateStatus(p.id, "suspended")} title="Suspender"
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => updateStatus(p.id, "approved")} title="Reactivar"
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => deleteProfile(p.id)} title="Eliminar"
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Notes modal */}
      {editingNotes && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
            <h4 className="font-display font-bold text-foreground mb-3">Notas del admin</h4>
            <textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)} rows={4}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none resize-none mb-4"
              placeholder="Notas privadas sobre este músico..." />
            <div className="flex gap-2">
              <button onClick={() => saveNotes(editingNotes)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-body font-bold text-sm">Guardar</button>
              <button onClick={() => setEditingNotes(null)} className="px-4 py-2 rounded-xl bg-muted text-foreground font-body text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Location modal */}
      {editingLocation && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
            <h4 className="font-display font-bold text-foreground mb-3">Editar ubicación</h4>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-body font-semibold text-foreground mb-1">Estado</label>
                <select value={locState} onChange={(e) => { setLocState(e.target.value); const cities = ESTADOS_CIUDADES[e.target.value]; if (cities?.length) setLocCity(cities[0]); }}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none">
                  {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-body font-semibold text-foreground mb-1">Ciudad</label>
                <select value={locCity} onChange={(e) => setLocCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none">
                  {(ESTADOS_CIUDADES[locState] || []).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => saveLocation(editingLocation)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-body font-bold text-sm">Guardar</button>
              <button onClick={() => setEditingLocation(null)} className="px-4 py-2 rounded-xl bg-muted text-foreground font-body text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusiciansPanel;
