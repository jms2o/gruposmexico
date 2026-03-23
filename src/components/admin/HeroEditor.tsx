import { useState } from "react";
import { adminApi } from "@/lib/api";
import { useSiteContent } from "@/hooks/useData";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Type } from "lucide-react";
import { toast } from "sonner";
import FileUploadField from "./FileUploadField";

interface Props {
  password: string;
}

const HeroEditor = ({ password }: Props) => {
  const { data: content } = useSiteContent("hero");
  const queryClient = useQueryClient();
  const [edits, setEdits] = useState<Record<string, string>>({});

  const getValue = (key: string) => {
    if (edits[key] !== undefined) return edits[key];
    const item = content?.find((c: any) => c.key === key);
    return item?.value || "";
  };

  const setEdit = (key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  const hasChanges = Object.keys(edits).length > 0;

  const handleSave = async () => {
    try {
      const items = Object.entries(edits).map(([key, value]) => ({
        section: "hero",
        key,
        value,
        type: key === "background_image" ? "image" : "text",
      }));
      await adminApi.call(password, { action: "bulk_upsert_content", items });
      setEdits({});
      toast.success("Hero actualizado");
      queryClient.invalidateQueries({ queryKey: ["site-content"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fields = [
    { key: "badge_text", label: "Texto del badge superior" },
    { key: "title_line1", label: "Título línea 1" },
    { key: "title_line2", label: "Título línea 2 (dorado)" },
    { key: "subtitle", label: "Subtítulo" },
    { key: "cta_primary", label: "Botón principal (WhatsApp)" },
    { key: "cta_secondary", label: "Botón secundario" },
    { key: "trust_badge_1", label: "Badge de confianza 1" },
    { key: "trust_badge_2", label: "Badge de confianza 2" },
    { key: "trust_badge_3", label: "Badge de confianza 3" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-foreground text-xl flex items-center gap-2">
          <Type className="w-5 h-5 text-gold" /> Editor del Hero
        </h3>
        {hasChanges && (
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-body font-bold text-sm hover:opacity-90 transition-opacity">
            <Save className="w-4 h-4" /> Guardar cambios
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div>
          <label className="text-xs font-body text-muted-foreground mb-1 block">Imagen de fondo</label>
          <FileUploadField
            value={getValue("background_image")}
            onChange={(url) => setEdit("background_image", url)}
            password={password}
            label="Subir imagen"
          />
        </div>

        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-xs font-body text-muted-foreground mb-1 block">{f.label}</label>
            <input
              type="text"
              value={getValue(f.key)}
              onChange={(e) => setEdit(f.key, e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroEditor;
