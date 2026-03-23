import HeroEditor from "@/components/admin/HeroEditor";
import AdminCrudTable from "@/components/admin/AdminCrudTable";
import GroupMediaManager from "@/components/admin/GroupMediaManager";
import SectionOrderManager from "@/components/admin/SectionOrderManager";
import CustomSectionsManager from "@/components/admin/CustomSectionsManager";
import SoundPackagesManager from "@/components/admin/SoundPackagesManager";
import SettingsEditor from "@/components/admin/SettingsEditor";
import ApprovalsPanel from "@/components/admin/ApprovalsPanel";
import MusiciansPanel from "@/components/admin/MusiciansPanel";
import MonetizationPanel from "@/components/admin/MonetizationPanel";
import MenuManager from "@/components/admin/MenuManager";
import { useCategories, useAllGroups, useTestimonials, useFaqs } from "@/hooks/useData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Settings, ChevronRight } from "lucide-react";

const cardStyle = { background: "hsl(230 15% 11%)", border: "1px solid hsl(230 10% 16%)", borderRadius: "16px" };

type SubTab = "settings" | "hero" | "categories" | "groups" | "media" | "testimonials" | "faqs" | "packages" | "sections" | "custom" | "menu" | "musicians" | "approvals" | "monetization";

const AdminConfiguracion = ({ password, onRefresh }: { password: string; onRefresh: () => void }) => {
  const [sub, setSub] = useState<SubTab>("settings");
  const { data: categories } = useCategories();
  const { data: groups } = useAllGroups();
  const { data: testimonials } = useTestimonials();
  const { data: faqs } = useFaqs();
  const { data: customSections } = useQuery({
    queryKey: ["all-custom-sections-cfg"],
    queryFn: async () => {
      const { data } = await supabase.from("custom_sections").select("*").order("sort_order");
      return data || [];
    },
  });

  const tabs: { key: SubTab; label: string }[] = [
    { key: "settings", label: "Ajustes Generales" },
    { key: "hero", label: "Hero / Portada" },
    { key: "menu", label: "Menú" },
    { key: "categories", label: "Categorías" },
    { key: "groups", label: "Grupos Catálogo" },
    { key: "media", label: "Multimedia" },
    { key: "testimonials", label: "Testimonios" },
    { key: "faqs", label: "FAQs" },
    { key: "packages", label: "Paquetes de Sonido" },
    { key: "sections", label: "Orden de Secciones" },
    { key: "custom", label: "Secciones Custom" },
    { key: "musicians", label: "Panel Músicos" },
    { key: "approvals", label: "Aprobaciones" },
    { key: "monetization", label: "Monetización" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-xl" style={{ color: "hsl(0 0% 95%)" }}>Configuración</h2>

      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setSub(t.key)} className="px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all"
            style={sub === t.key ? { background: "hsl(265 60% 55% / 0.2)", color: "hsl(265 60% 65%)" } : { background: "hsl(230 10% 14%)", color: "hsl(230 10% 50%)" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 rounded-2xl" style={cardStyle}>
        {sub === "settings" && <SettingsEditor password={password} />}
        {sub === "hero" && <HeroEditor password={password} />}
        {sub === "menu" && <MenuManager password={password} />}
        {sub === "categories" && (
          <AdminCrudTable title="Categorías" items={categories || []}
            fields={[{ key: "title", label: "Título", type: "text" }, { key: "price", label: "Precio", type: "text" }, { key: "image_url", label: "Imagen", type: "image" }, { key: "alt_text", label: "Alt text", type: "text" }, { key: "sort_order", label: "Orden", type: "number" }]}
            table="categories" password={password} onRefresh={onRefresh} sectionKey="categories" sectionLabel="Categorías" />
        )}
        {sub === "groups" && (
          <AdminCrudTable title="Grupos Musicales" items={groups || []}
            fields={[{ key: "name", label: "Nombre", type: "text" }, { key: "category_id", label: "Categoría", type: "select", options: (categories || []).map((c: any) => ({ value: c.id, label: c.title })) }, { key: "price", label: "Precio", type: "text" }, { key: "badge", label: "Badge", type: "text" }, { key: "description", label: "Descripción", type: "textarea" }, { key: "featured", label: "Destacado", type: "checkbox" }, { key: "image_url", label: "Imagen", type: "image" }]}
            table="musical_groups" password={password} onRefresh={onRefresh} sectionKey="featured" sectionLabel="Destacados" />
        )}
        {sub === "media" && <GroupMediaManager password={password} />}
        {sub === "testimonials" && (
          <AdminCrudTable title="Testimonios" items={testimonials || []}
            fields={[{ key: "name", label: "Nombre", type: "text" }, { key: "text", label: "Testimonio", type: "textarea" }, { key: "event_type", label: "Evento", type: "text" }, { key: "rating", label: "Rating", type: "number" }, { key: "photo_url", label: "Foto cliente", type: "image" }]}
            table="testimonials" password={password} onRefresh={onRefresh} sectionKey="testimonials" sectionLabel="Testimonios" />
        )}
        {sub === "faqs" && (
          <AdminCrudTable title="Preguntas Frecuentes" items={faqs || []}
            fields={[{ key: "question", label: "Pregunta", type: "text" }, { key: "answer", label: "Respuesta", type: "textarea" }, { key: "sort_order", label: "Orden", type: "number" }]}
            table="faqs" password={password} onRefresh={onRefresh} sectionKey="faqs" sectionLabel="FAQs" />
        )}
        {sub === "packages" && <SoundPackagesManager password={password} />}
        {sub === "sections" && <SectionOrderManager password={password} />}
        {sub === "custom" && <CustomSectionsManager password={password} customSections={customSections || []} />}
        {sub === "musicians" && <MusiciansPanel password={password} />}
        {sub === "approvals" && <ApprovalsPanel password={password} />}
        {sub === "monetization" && <MonetizationPanel password={password} />}
      </div>
    </div>
  );
};

export default AdminConfiguracion;
