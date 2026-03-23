import { useState } from "react";
import { adminApi } from "@/lib/api";
import { useSiteContent } from "@/hooks/useData";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Settings } from "lucide-react";
import { toast } from "sonner";

interface Props {
  password: string;
  section: string;
  sectionLabel: string;
}

const SectionTextEditor = ({ password, section, sectionLabel }: Props) => {
  const { data: content } = useSiteContent(section);
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
        section,
        key,
        value,
        type: "text",
      }));
      await adminApi.call(password, { action: "bulk_upsert_content", items });
      setEdits({});
      toast.success(`${sectionLabel} actualizado`);
      queryClient.invalidateQueries({ queryKey: ["site-content"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fields = [
    { key: "title", label: "Título" },
    { key: "title_accent", label: "Título (parte dorada)" },
    { key: "subtitle", label: "Subtítulo" },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-body font-semibold text-foreground flex items-center gap-2 text-sm">
          <Settings className="w-4 h-4 text-gold" /> Textos de {sectionLabel}
        </h4>
        {hasChanges && (
          <button onClick={handleSave} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-xs">
            <Save className="w-3 h-3" /> Guardar
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-xs font-body text-muted-foreground">{f.label}</label>
            <input
              type="text"
              value={getValue(f.key)}
              onChange={(e) => setEdit(f.key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionTextEditor;
