import { useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { useSectionOrder } from "@/hooks/useData";
import { useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import { Eye, EyeOff, Save, LayoutList } from "lucide-react";
import { toast } from "sonner";

interface Props {
  password: string;
}

const SectionOrderManager = ({ password }: Props) => {
  const { data: sections } = useSectionOrder();
  const queryClient = useQueryClient();
  const [localSections, setLocalSections] = useState<any[] | null>(null);
  const [dirty, setDirty] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor));

  const items = localSections || sections || [];

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((s: any) => s.id === active.id);
    const newIndex = items.findIndex((s: any) => s.id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex).map((s: any, i: number) => ({ ...s, sort_order: i }));
    setLocalSections(newItems);
    setDirty(true);
  }, [items]);

  const toggleVisibility = (id: string) => {
    const updated = items.map((s: any) => s.id === id ? { ...s, visible: !s.visible } : s);
    setLocalSections(updated);
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      // Save order
      await adminApi.call(password, {
        action: "reorder",
        table: "section_order",
        items: items.map((s: any) => ({ id: s.id, sort_order: s.sort_order })),
      });
      // Save visibility
      for (const s of items) {
        await adminApi.call(password, {
          action: "update",
          table: "section_order",
          id: s.id,
          data: { visible: s.visible },
        });
      }
      setDirty(false);
      setLocalSections(null);
      toast.success("Orden guardado");
      queryClient.invalidateQueries({ queryKey: ["section-order"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-foreground text-xl flex items-center gap-2">
          <LayoutList className="w-5 h-5 text-gold" /> Orden de Secciones
        </h3>
        {dirty && (
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-body font-bold text-sm">
            <Save className="w-4 h-4" /> Guardar orden
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((s: any) => (
                <SortableItem key={s.id} id={s.id}>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
                    <span className="font-body font-semibold text-foreground">{s.label}</span>
                    <button
                      onClick={() => toggleVisibility(s.id)}
                      className={`p-2 rounded-lg transition-colors ${s.visible ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      {s.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default SectionOrderManager;
