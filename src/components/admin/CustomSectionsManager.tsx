import { useState } from "react";
import { adminApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useSiteContent } from "@/hooks/useData";
import { Save, Layers, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import FileUploadField from "./FileUploadField";

interface Props {
  password: string;
  customSections: any[];
}

const CustomSectionsManager = ({ password, customSections }: Props) => {
  const queryClient = useQueryClient();
  const [newSection, setNewSection] = useState({ title: "", subtitle: "", content: "", image_url: "", video_url: "" });

  const handleAdd = async () => {
    if (!newSection.title) { toast.error("El título es requerido"); return; }
    try {
      await adminApi.call(password, {
        action: "insert",
        table: "custom_sections",
        data: { ...newSection, sort_order: customSections.length + 100 },
      });
      setNewSection({ title: "", subtitle: "", content: "", image_url: "", video_url: "" });
      toast.success("Sección creada");
      queryClient.invalidateQueries({ queryKey: ["custom-sections"] });
      queryClient.invalidateQueries({ queryKey: ["all-custom-sections"] });
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta sección?")) return;
    try {
      await adminApi.call(password, { action: "delete", table: "custom_sections", id });
      toast.success("Sección eliminada");
      queryClient.invalidateQueries({ queryKey: ["custom-sections"] });
      queryClient.invalidateQueries({ queryKey: ["all-custom-sections"] });
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdate = async (id: string, data: Record<string, any>) => {
    try {
      await adminApi.call(password, { action: "update", table: "custom_sections", id, data });
      toast.success("Sección actualizada");
      queryClient.invalidateQueries({ queryKey: ["custom-sections"] });
      queryClient.invalidateQueries({ queryKey: ["all-custom-sections"] });
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-display font-bold text-foreground text-xl flex items-center gap-2">
        <Layers className="w-5 h-5 text-gold" /> Secciones Personalizadas
      </h3>

      {/* New section form */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm font-body font-semibold text-muted-foreground mb-3">Crear nueva sección</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-body text-muted-foreground">Título</label>
            <input value={newSection.title} onChange={(e) => setNewSection(p => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none" />
          </div>
          <div>
            <label className="text-xs font-body text-muted-foreground">Subtítulo</label>
            <input value={newSection.subtitle} onChange={(e) => setNewSection(p => ({ ...p, subtitle: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-body text-muted-foreground">Contenido</label>
            <textarea value={newSection.content} onChange={(e) => setNewSection(p => ({ ...p, content: e.target.value }))}
              rows={3} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none resize-none" />
          </div>
          <div>
            <label className="text-xs font-body text-muted-foreground">Imagen</label>
            <FileUploadField value={newSection.image_url} onChange={(url) => setNewSection(p => ({ ...p, image_url: url }))} password={password} />
          </div>
          <div>
            <label className="text-xs font-body text-muted-foreground">Video</label>
            <FileUploadField value={newSection.video_url} onChange={(url) => setNewSection(p => ({ ...p, video_url: url }))} password={password} accept="video/*" label="Subir video" maxSizeMB={100} />
          </div>
        </div>
        <button onClick={handleAdd} className="mt-3 inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm">
          <Plus className="w-4 h-4" /> Crear sección
        </button>
      </div>

      {/* Existing */}
      {customSections.map((s) => (
        <CustomSectionCard key={s.id} section={s} password={password} onUpdate={handleUpdate} onDelete={handleDelete} />
      ))}
    </div>
  );
};

const CustomSectionCard = ({ section, password, onUpdate, onDelete }: { section: any; password: string; onUpdate: (id: string, data: any) => void; onDelete: (id: string) => void }) => {
  const [edits, setEdits] = useState<Record<string, any>>({});
  const hasChanges = Object.keys(edits).length > 0;

  const getValue = (key: string) => edits[key] !== undefined ? edits[key] : section[key] || "";

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-body text-muted-foreground">Título</label>
          <input value={getValue("title")} onChange={(e) => setEdits(p => ({ ...p, title: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none" />
        </div>
        <div>
          <label className="text-xs font-body text-muted-foreground">Subtítulo</label>
          <input value={getValue("subtitle")} onChange={(e) => setEdits(p => ({ ...p, subtitle: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-body text-muted-foreground">Contenido</label>
          <textarea value={getValue("content")} onChange={(e) => setEdits(p => ({ ...p, content: e.target.value }))}
            rows={3} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none resize-none" />
        </div>
        <div>
          <label className="text-xs font-body text-muted-foreground">Imagen</label>
          <FileUploadField value={getValue("image_url")} onChange={(url) => setEdits(p => ({ ...p, image_url: url }))} password={password} />
        </div>
        <div>
          <label className="text-xs font-body text-muted-foreground">Video</label>
          <FileUploadField value={getValue("video_url")} onChange={(url) => setEdits(p => ({ ...p, video_url: url }))} password={password} accept="video/*" label="Subir video" maxSizeMB={100} />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {hasChanges && (
          <button onClick={() => { onUpdate(section.id, edits); setEdits({}); }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-xs">
            <Save className="w-3 h-3" /> Guardar
          </button>
        )}
        <button
          onClick={() => onUpdate(section.id, { visible: !section.visible })}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-body font-semibold text-xs ${section.visible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
        >
          {section.visible ? "Visible" : "Oculto"}
        </button>
        <button onClick={() => onDelete(section.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground font-body font-semibold text-xs">
          <Trash2 className="w-3 h-3" /> Eliminar
        </button>
      </div>
    </div>
  );
};

export default CustomSectionsManager;
