import { useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import FileUploadField from "./FileUploadField";
import SectionTextEditor from "./SectionTextEditor";
import { Trash2, Plus, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface SelectOption {
  value: string;
  label: string;
}

interface Field {
  key: string;
  label: string;
  type: "text" | "number" | "checkbox" | "image" | "video" | "textarea" | "select";
  options?: SelectOption[];
}

interface Props {
  title: string;
  items: Record<string, any>[];
  fields: Field[];
  table: string;
  password: string;
  onRefresh: () => void;
  sectionKey?: string;
  sectionLabel?: string;
  enableDragDrop?: boolean;
  enableVisibility?: boolean;
}

const AdminCrudTable = ({
  title, items, fields, table, password, onRefresh,
  sectionKey, sectionLabel, enableDragDrop = true, enableVisibility = true,
}: Props) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Record<string, Record<string, any>>>({});
  const [newItem, setNewItem] = useState<Record<string, any>>({});
  const [localItems, setLocalItems] = useState<any[] | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const displayItems = localItems || items;

  const handleEdit = (id: string, key: string, value: any) => {
    setEditing((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  const handleSave = async (id: string) => {
    if (!editing[id]) return;
    try {
      await adminApi.call(password, { action: "update", table, id, data: editing[id] });
      setEditing((prev) => { const n = { ...prev }; delete n[id]; return n; });
      toast.success("Guardado");
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAdd = async () => {
    const requiredFields = fields.filter((f) => f.type !== "checkbox");
    const hasRequired = requiredFields.some((f) => newItem[f.key]);
    if (!hasRequired) { toast.error("Llena al menos un campo"); return; }
    try {
      await adminApi.call(password, { action: "insert", table, data: { ...newItem, sort_order: items.length } });
      setNewItem({});
      toast.success("Agregado");
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await adminApi.call(password, { action: "delete", table, id });
      toast.success("Eliminado");
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleToggleVisibility = async (id: string, current: boolean) => {
    try {
      await adminApi.call(password, { action: "update", table, id, data: { visible: !current } });
      toast.success(!current ? "Visible" : "Oculto");
      onRefresh();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = displayItems.findIndex((i) => i.id === active.id);
    const newIndex = displayItems.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(displayItems, oldIndex, newIndex).map((item, i) => ({ ...item, sort_order: i }));
    setLocalItems(reordered);
    try {
      await adminApi.call(password, {
        action: "reorder",
        table,
        items: reordered.map((item) => ({ id: item.id, sort_order: item.sort_order })),
      });
      toast.success("Orden actualizado");
      onRefresh();
      setLocalItems(null);
    } catch (err: any) {
      toast.error(err.message);
      setLocalItems(null);
    }
  }, [displayItems, password, table, onRefresh]);

  const renderField = (f: Field, value: any, onChange: (val: any) => void) => {
    if (f.type === "select") {
      return (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none"
        >
          <option value="">-- Sin categoría --</option>
          {(f.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }
    if (f.type === "image") {
      return <FileUploadField value={value || ""} onChange={onChange} password={password} accept="image/*" label="Subir" />;
    }
    if (f.type === "video") {
      return <FileUploadField value={value || ""} onChange={onChange} password={password} accept="video/*,image/*" label="Subir" maxSizeMB={100} />;
    }
    if (f.type === "checkbox") {
      return <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="ml-2 mt-1 w-5 h-5 accent-primary" />;
    }
    if (f.type === "textarea") {
      return (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none resize-none"
        />
      );
    }
    return (
      <input
        type={f.type}
        value={value ?? ""}
        onChange={(e) => onChange(f.type === "number" ? Number(e.target.value) : e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-body text-sm focus:ring-2 focus:ring-ring outline-none"
      />
    );
  };

  const renderItemCard = (item: any) => (
    <div key={item.id} className="bg-card border border-border rounded-xl p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-xs font-body text-muted-foreground">{f.label}</label>
            {renderField(f, editing[item.id]?.[f.key] ?? item[f.key], (val) => handleEdit(item.id, f.key, val))}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        {editing[item.id] && (
          <button onClick={() => handleSave(item.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-xs">
            <Save className="w-3 h-3" /> Guardar
          </button>
        )}
        {enableVisibility && item.visible !== undefined && (
          <button
            onClick={() => handleToggleVisibility(item.id, item.visible)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-body font-semibold text-xs ${item.visible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            {item.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {item.visible ? "Visible" : "Oculto"}
          </button>
        )}
        <button onClick={() => handleDelete(item.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground font-body font-semibold text-xs hover:opacity-80">
          <Trash2 className="w-3 h-3" /> Eliminar
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {sectionKey && sectionLabel && (
        <SectionTextEditor password={password} section={sectionKey} sectionLabel={sectionLabel} />
      )}

      <h3 className="font-display font-bold text-foreground text-xl mb-4">{title}</h3>

      {/* Add new */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <p className="text-sm font-body font-semibold text-muted-foreground mb-3">Agregar nuevo</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-body text-muted-foreground">{f.label}</label>
              {renderField(f, newItem[f.key], (val) => setNewItem((p) => ({ ...p, [f.key]: val })))}
            </div>
          ))}
        </div>
        <button onClick={handleAdd} className="mt-3 inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm">
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      {/* Existing items */}
      {enableDragDrop ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {displayItems.map((item) => (
                <SortableItem key={item.id} id={item.id}>
                  {renderItemCard(item)}
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-3">
          {displayItems.map((item) => renderItemCard(item))}
        </div>
      )}
    </div>
  );
};

export default AdminCrudTable;
