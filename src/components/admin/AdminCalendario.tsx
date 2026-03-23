import { useAdminBookings } from "@/hooks/useAdminData";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const cardStyle = { background: "hsl(230 15% 11%)", border: "1px solid hsl(230 10% 16%)", borderRadius: "16px" };

const AdminCalendario = ({ password }: { password: string }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: bookings } = useAdminBookings(password);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString("es-MX", { month: "long", year: "numeric" });

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const getBookingsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return (bookings || []).filter((b: any) => b.event_date?.startsWith(dateStr));
  };

  const eventColors = ["hsl(265 60% 55%)", "hsl(142 70% 50%)", "hsl(40 65% 50%)", "hsl(200 70% 55%)", "hsl(0 70% 55%)"];

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-xl" style={{ color: "hsl(0 0% 95%)" }}>Calendario de Eventos</h2>

      <div className="p-6" style={cardStyle}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-lg capitalize" style={{ color: "hsl(0 0% 95%)" }}>{monthName}</h3>
          <div className="flex items-center gap-2">
            <button onClick={prev} className="p-2 rounded-lg" style={{ background: "hsl(230 10% 16%)" }}><ChevronLeft className="w-4 h-4" style={{ color: "hsl(230 10% 55%)" }} /></button>
            <button onClick={next} className="p-2 rounded-lg" style={{ background: "hsl(230 10% 16%)" }}><ChevronRight className="w-4 h-4" style={{ color: "hsl(230 10% 55%)" }} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px" style={{ background: "hsl(230 10% 14%)" }}>
          {days.map(d => (
            <div key={d} className="p-2 text-center font-body text-xs font-semibold" style={{ background: "hsl(230 15% 11%)", color: "hsl(230 10% 45%)" }}>{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2 min-h-[80px]" style={{ background: "hsl(230 15% 9%)" }} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayBookings = getBookingsForDay(day);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            return (
              <div key={day} className="p-2 min-h-[80px] relative" style={{ background: isToday ? "hsl(265 60% 55% / 0.08)" : "hsl(230 15% 11%)" }}>
                <span className={`font-body text-xs ${isToday ? "font-bold" : ""}`} style={{ color: isToday ? "hsl(265 60% 65%)" : "hsl(230 10% 55%)" }}>{day}</span>
                <div className="mt-1 space-y-0.5">
                  {dayBookings.slice(0, 2).map((b: any, idx: number) => (
                    <div key={b.id} className="text-[9px] font-body truncate px-1 py-0.5 rounded" style={{ background: eventColors[idx % eventColors.length] + "22", color: eventColors[idx % eventColors.length] }}>
                      {b.group_profiles?.group_name} – {b.group_profiles?.city}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <span className="text-[9px] font-body" style={{ color: "hsl(230 10% 45%)" }}>+{dayBookings.length - 2} más</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminCalendario;
