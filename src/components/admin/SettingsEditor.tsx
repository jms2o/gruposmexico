import { useState } from "react";
import { adminApi } from "@/lib/api";
import { useSiteContent, useWhatsappNumber } from "@/hooks/useData";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Phone, Mail, MapPin, Clock, FileText } from "lucide-react";
import { toast } from "sonner";

interface Props {
  password: string;
}

const SettingsEditor = ({ password }: Props) => {
  const { data: whatsappNumber } = useWhatsappNumber();
  const { data: contactContent } = useSiteContent("contact");
  const { data: footerContent } = useSiteContent("footer");
  const queryClient = useQueryClient();

  const [wpNumber, setWpNumber] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});

  // Init wp number
  if (!wpNumber && whatsappNumber) {
    setWpNumber(whatsappNumber);
  }

  const getContactValue = (key: string) => {
    if (edits[`contact.${key}`] !== undefined) return edits[`contact.${key}`];
    const item = contactContent?.find((c: any) => c.key === key);
    return item?.value || "";
  };

  const getFooterValue = (key: string) => {
    if (edits[`footer.${key}`] !== undefined) return edits[`footer.${key}`];
    const item = footerContent?.find((c: any) => c.key === key);
    return item?.value || "";
  };

  const setContactEdit = (key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [`contact.${key}`]: value }));
  };

  const setFooterEdit = (key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [`footer.${key}`]: value }));
  };

  const handleSaveAll = async () => {
    try {
      // Save WhatsApp number
      await adminApi.call(password, { action: "upsert_setting", data: { key: "whatsapp_number", value: wpNumber } });

      // Save content edits
      const items: any[] = [];
      Object.entries(edits).forEach(([fullKey, value]) => {
        const [section, key] = fullKey.split(".");
        items.push({ section, key, value, type: "text" });
      });
      if (items.length > 0) {
        await adminApi.call(password, { action: "bulk_upsert_content", items });
      }

      setEdits({});
      toast.success("Ajustes guardados");
      queryClient.invalidateQueries();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-foreground text-xl">Ajustes Generales</h3>
        <button onClick={handleSaveAll} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-body font-bold text-sm">
          <Save className="w-4 h-4" /> Guardar todo
        </button>
      </div>

      {/* WhatsApp */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h4 className="font-body font-semibold text-foreground mb-4 flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary" /> WhatsApp
        </h4>
        <input value={wpNumber} onChange={(e) => setWpNumber(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none"
          placeholder="5216691234567" />
      </div>

      {/* Contact Info */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h4 className="font-body font-semibold text-foreground flex items-center gap-2">
          <Mail className="w-4 h-4 text-gold" /> Información de Contacto
        </h4>
        <div>
          <label className="text-xs font-body text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> Correo electrónico</label>
          <input value={getContactValue("email")} onChange={(e) => setContactEdit("email", e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none" placeholder="correo@ejemplo.com" />
        </div>
        <div>
          <label className="text-xs font-body text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Ubicación</label>
          <input value={getContactValue("location")} onChange={(e) => setContactEdit("location", e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none" />
        </div>
        <div>
          <label className="text-xs font-body text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Horario</label>
          <input value={getContactValue("hours")} onChange={(e) => setContactEdit("hours", e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none" />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h4 className="font-body font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-gold" /> Footer
        </h4>
        <div>
          <label className="text-xs font-body text-muted-foreground">Nombre de marca</label>
          <input value={getFooterValue("brand_name")} onChange={(e) => setFooterEdit("brand_name", e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none" />
        </div>
        <div>
          <label className="text-xs font-body text-muted-foreground">Descripción de marca</label>
          <textarea value={getFooterValue("brand_description")} onChange={(e) => setFooterEdit("brand_description", e.target.value)}
            rows={2} className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none resize-none" />
        </div>
        <div>
          <label className="text-xs font-body text-muted-foreground">Copyright</label>
          <input value={getFooterValue("copyright")} onChange={(e) => setFooterEdit("copyright", e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground font-body focus:ring-2 focus:ring-ring outline-none" />
        </div>
      </div>
    </div>
  );
};

export default SettingsEditor;
