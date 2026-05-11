import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/lib/api";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import { Eye, EyeOff, Save, Menu, Trash2, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  password: string;
}

const MenuManager = ({ password }: Props) => {
  const queryClient = useQueryClient();

  const { data: categories, refetch } = useQuery({
    queryKey: ["admin-all-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data || [];
    },
  });

  // Featured sections - manually curated groups
  const { data: allGroups } = useQuery({
    queryKey: ["all-groups"],
    queryFn: async () => {
      const { data } = await supabase.from("musical_groups").select("*").order("sort_order");
      return data || [];
    },
  });

  const [localCategories, setLocalCategories] = useState<any[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const items = localCategories || categories || [];

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((s: any) => s.id === active.id);
    const newIndex = items.findIndex((s: any) => s.id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex).map((s: any, i: number) => ({ ...s, sort_order: i + 1 }));
    setLocalCategories(newItems);
    setDirty(true);
  }, [items]);

  const toggleVisibility = (id: string) => {
    const updated = items.map((s: any) => s.id === id ? { ...s, visible: !s.visible } : s);
    setLocalCategories(updated);
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      for (const cat of items) {
        await adminApi.call(password, {
          action: "update", table: "categories", id: cat.id,
          data: { sort_order: cat.sort_order, visible: cat.visible },
        });
      }
      setDirty(false);
      setLocalCategories(null);
      toast.success("Menú actualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-all-categories"] });
      queryClient.invalidateQueries({ queryKey: ["visible-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Toggle featured for a group
  const toggleFeatured = async (groupId: string, current: boolean) => {
    try {
      await adminApi.call(password, {
        action: "update", table: "musical_groups", id: groupId,
        data: { featured: !current },
      });
      toast.success(current ? "Quitado de destacados" : "Añadido a destacados");
      queryClient.invalidateQueries({ queryKey: ["all-groups"] });
      queryClient.invalidateQueries({ queryKey: ["featured-groups"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const visibleGroups = allGroups?.filter((g: any) => g.visible) || [];
  const catMap = Object.fromEntries((categories || []).map((c: any) => [c.id, c.title]));

  return (
    <div className="space-y-8">
      {/* Category Menu Order */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-foreground text-xl flex items-center gap-2">
            <Menu className="w-5 h-5 text-gold" /> Gestión de Menú
          </h3>
          {dirty && (
            <button onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-body font-bold text-sm">
              <Save className="w-4 h-4" /> Guardar cambios
            </button>
          )}
        </div>

        <p className="font-body text-sm text-muted-foreground">
          Arrastra para reordenar las categorías del menú. Activa/desactiva su visibilidad.
        </p>

        <div className="bg-card border border-border rounded-xl p-5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((cat: any) => (
                  <SortableItem key={cat.id} id={cat.id}>
                    <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                      <div>
                        <span className="font-body font-semibold text-foreground">{cat.title}</span>
                        <span className="ml-2 text-xs font-body text-muted-foreground">{cat.price}</span>
                      </div>
                      <button
                        onClick={() => toggleVisibility(cat.id)}
                        className={cn("p-2 rounded-lg transition-colors",
                          cat.visible ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted")}
                      >
                        {cat.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {items.length === 0 && (
            <p className="text-center text-muted-foreground font-body text-sm py-8">No hay categorías creadas. Ve a la pestaña "Categorías" para crear una.</p>
          )}
        </div>
      </div>

      {/* Manual Featured/Sections Control */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-foreground text-xl flex items-center gap-2">
           Grupos Destacados (Manual)
        </h3>
        <p className="font-body text-sm text-muted-foreground">
          Selecciona qué grupos aparecen en la sección "Destacados" de la página principal.
        </p>

        <div className="bg-card border border-border rounded-xl p-5 space-y-2">
          {visibleGroups.map((g: any) => (
            <div key={g.id} className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border">
              <div className="flex items-center gap-3">
                {g.image_url && <img src={g.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                <div>
                  <p className="font-body font-semibold text-foreground text-sm">{g.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{catMap[g.category_id] || "Sin categoría"} · {g.price}</p>
                </div>
              </div>
              <button
                onClick={() => toggleFeatured(g.id, g.featured)}
                className={cn("px-3 py-1.5 rounded-lg font-body text-xs font-bold transition-colors",
                  g.featured ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground hover:text-foreground")}
              >
                {g.featured ? " Destacado" : "Destacar"}
              </button>
            </div>
          ))}
          {visibleGroups.length === 0 && (
            <p className="text-center text-muted-foreground font-body text-sm py-4">No hay grupos visibles.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuManager;
