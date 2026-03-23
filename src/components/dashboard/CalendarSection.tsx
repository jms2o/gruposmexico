import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  profileId: string;
}

const DAYS = ["D", "L", "M", "M", "J", "V", "S"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const CalendarSection = ({ profileId }: Props) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadBlockedDates();
  }, [profileId]);

  const loadBlockedDates = async () => {
    const { data } = await supabase
      .from("blocked_dates")
      .select("blocked_date")
      .eq("group_profile_id", profileId);
    if (data) {
      setBlockedDates(new Set(data.map((d: any) => d.blocked_date)));
    }
  };

  const toggleDate = async (dateStr: string) => {
    setLoading(true);
    try {
      if (blockedDates.has(dateStr)) {
        await supabase.from("blocked_dates")
          .delete()
          .eq("group_profile_id", profileId)
          .eq("blocked_date", dateStr);
        setBlockedDates((prev) => {
          const next = new Set(prev);
          next.delete(dateStr);
          return next;
        });
      } else {
        await supabase.from("blocked_dates")
          .insert({ group_profile_id: profileId, blocked_date: dateStr });
        setBlockedDates((prev) => new Set(prev).add(dateStr));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const cells: { day: number; current: boolean; dateStr: string }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      cells.push({ day: d, current: false, dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, current: true, dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      cells.push({ day: d, current: false, dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
    }
    return cells;
  }, [year, month]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-gold" /> Calendario
        </h2>
        <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-body text-xs">Calendario Editable</span>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h3 className="font-display font-bold text-lg text-foreground min-w-[200px] text-center">
          {MONTHS[month]} de {year}
        </h3>
        <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center font-body text-xs font-bold text-muted-foreground py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((cell, i) => {
          const isBlocked = blockedDates.has(cell.dateStr);
          const isToday = cell.dateStr === today;
          const isPast = cell.dateStr < today;
          return (
            <button
              key={i}
              onClick={() => cell.current && !isPast && toggleDate(cell.dateStr)}
              disabled={!cell.current || isPast || loading}
              className={cn(
                "aspect-square rounded-lg flex items-center justify-center font-body text-sm font-semibold transition-all duration-200",
                !cell.current && "text-muted-foreground/30",
                cell.current && !isBlocked && !isPast && "text-foreground hover:bg-primary/10",
                cell.current && isBlocked && "bg-destructive/20 text-destructive font-bold",
                cell.current && !isBlocked && !isPast && "bg-primary/10 text-primary",
                isPast && cell.current && "text-muted-foreground/50 cursor-default",
                isToday && "ring-2 ring-primary"
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary/20" />
          <span className="font-body text-xs text-muted-foreground">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-destructive/20" />
          <span className="font-body text-xs text-muted-foreground">No disponible</span>
        </div>
      </div>

      <div className="text-center mt-4">
        <button
          onClick={() => toast.info("Haz clic en las fechas para bloquear/desbloquear")}
          className="btn-whatsapp px-6 py-3 text-sm"
        >
          Selecciona fechas para bloquear
        </button>
      </div>
    </div>
  );
};

export default CalendarSection;
