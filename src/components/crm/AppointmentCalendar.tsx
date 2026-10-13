import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarAppointment = {
  id: number;
  clientId: number;
  clientName: string;
  scheduledAt: string;
  serviceType: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  notes?: string | null;
};

const statusStyles: Record<CalendarAppointment["status"], string> = {
  scheduled: "border-primary/30 bg-primary/10 text-primary",
  completed: "border-accent/30 bg-accent/10 text-accent-foreground",
  cancelled: "border-border bg-muted text-muted-foreground line-through",
  no_show: "border-destructive/30 bg-destructive/10 text-destructive",
};

const WEEK_HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 07:00–18:00

function apptHour(iso: string) {
  return parseISO(iso).getHours() + parseISO(iso).getMinutes() / 60;
}

export function AppointmentCalendar({
  appointments,
  onSelectDay,
  onSelectAppointment,
  onSelectSlot,
}: {
  appointments: CalendarAppointment[];
  onSelectDay: (day: Date) => void;
  onSelectAppointment: (appointment: CalendarAppointment) => void;
  onSelectSlot: (day: Date, hour: number) => void;
}) {
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: endOfWeek(cursor, { weekStartsOn: 1 }) });
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    for (const item of appointments) {
      const key = format(parseISO(item.scheduledAt), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    }
    return map;
  }, [appointments]);

  const selectedKey = format(selectedDay, "yyyy-MM-dd");
  const selectedAppointments = byDay.get(selectedKey) ?? [];

  function goToday() {
    const today = startOfDay(new Date());
    setCursor(today);
    setSelectedDay(today);
  }

  function shift(direction: -1 | 1) {
    setCursor((current) =>
      view === "month" ? addMonths(current, direction) : addWeeks(current, direction),
    );
  }

  function pickDay(day: Date) {
    setSelectedDay(startOfDay(day));
    onSelectDay(day);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <section className="rounded-sm border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => shift(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => shift(1)}>
              <ChevronRight className="size-4" />
            </Button>
            <h2 className="ml-2 font-display text-lg font-semibold">
              {view === "month"
                ? format(cursor, "MMMM yyyy")
                : `Week of ${format(weekDays[0]!, "d MMM")} – ${format(weekDays[6]!, "d MMM yyyy")}`}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={goToday}>
              Today
            </Button>
            <div className="inline-flex rounded-sm border border-border p-0.5">
              <Button
                type="button"
                size="sm"
                variant={view === "month" ? "secondary" : "ghost"}
                onClick={() => setView("month")}
              >
                Month
              </Button>
              <Button
                type="button"
                size="sm"
                variant={view === "week" ? "secondary" : "ghost"}
                onClick={() => setView("week")}
              >
                Week
              </Button>
            </div>
          </div>
        </div>

        {view === "month" ? (
          <div className="p-3 md:p-4">
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
                <div key={label} className="py-1">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayItems = byDay.get(key) ?? [];
                const inMonth = isSameMonth(day, cursor);
                const selected = isSameDay(day, selectedDay);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => pickDay(day)}
                    onDoubleClick={() => onSelectSlot(day, 9)}
                    className={cn(
                      "min-h-28 rounded-sm border p-1.5 text-left transition-colors hover:border-primary/40",
                      inMonth ? "bg-background" : "bg-muted/30 text-muted-foreground",
                      selected && "border-primary ring-1 ring-primary/30",
                      isToday(day) && !selected && "border-primary/50",
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={cn(
                          "grid size-6 place-items-center rounded-full text-xs font-semibold",
                          isToday(day) && "bg-primary text-primary-foreground",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {dayItems.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">{dayItems.length}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayItems.slice(0, 3).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectAppointment(item);
                          }}
                          className={cn(
                            "block w-full truncate rounded border px-1 py-0.5 text-[10px] font-medium",
                            statusStyles[item.status],
                          )}
                          title={`${item.clientName} · ${item.serviceType}`}
                        >
                          {format(parseISO(item.scheduledAt), "HH:mm")} {item.clientName}
                        </button>
                      ))}
                      {dayItems.length > 3 && (
                        <p className="text-[10px] text-muted-foreground">+{dayItems.length - 3} more</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto p-3 md:p-4">
            <div className="min-w-[720px]">
              <div className="mb-2 grid grid-cols-[56px_repeat(7,1fr)] gap-1 text-center text-xs font-medium text-muted-foreground">
                <div />
                {weekDays.map((day) => (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => pickDay(day)}
                    className={cn(
                      "rounded-sm py-1 hover:bg-secondary",
                      isSameDay(day, selectedDay) && "bg-secondary text-foreground",
                      isToday(day) && "text-primary",
                    )}
                  >
                    <div>{format(day, "EEE")}</div>
                    <div className="font-semibold">{format(day, "d")}</div>
                  </button>
                ))}
              </div>
              <div className="relative grid grid-cols-[56px_repeat(7,1fr)] gap-1">
                {WEEK_HOURS.map((hour) => (
                  <div key={hour} className="contents">
                    <div className="pr-2 pt-1 text-right text-[10px] text-muted-foreground">
                      {String(hour).padStart(2, "0")}:00
                    </div>
                    {weekDays.map((day) => {
                      const key = format(day, "yyyy-MM-dd");
                      const dayItems = (byDay.get(key) ?? []).filter((item) => {
                        const h = apptHour(item.scheduledAt);
                        return h >= hour && h < hour + 1;
                      });
                      return (
                        <button
                          key={`${key}-${hour}`}
                          type="button"
                          onClick={() => {
                            pickDay(day);
                            onSelectSlot(day, hour);
                          }}
                          className="min-h-14 rounded-sm border border-dashed border-border/70 bg-background/60 p-0.5 text-left hover:border-primary/40 hover:bg-primary-soft/40"
                        >
                          <div className="space-y-0.5">
                            {dayItems.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onSelectAppointment(item);
                                }}
                                className={cn(
                                  "block w-full truncate rounded border px-1 py-0.5 text-[10px] font-medium",
                                  statusStyles[item.status],
                                )}
                              >
                                {format(parseISO(item.scheduledAt), "HH:mm")} {item.clientName}
                              </button>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <aside className="rounded-sm border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Selected day</p>
            <h3 className="font-display text-lg font-semibold">
              {format(selectedDay, "EEEE, d MMM yyyy")}
            </h3>
          </div>
          <Button type="button" size="sm" onClick={() => onSelectSlot(selectedDay, 9)}>
            Book
          </Button>
        </div>

        <ul className="mt-5 space-y-3">
          {selectedAppointments.length === 0 && (
            <li className="rounded-sm border border-dashed border-border p-4 text-sm text-muted-foreground">
              No appointments this day. Click Book or double-click a calendar cell.
            </li>
          )}
          {selectedAppointments.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectAppointment(item)}
                className="w-full rounded-sm border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {format(parseISO(item.scheduledAt), "HH:mm")}
                  </p>
                  <Badge variant="secondary" className="capitalize">
                    {item.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-medium">{item.clientName}</p>
                <p className="text-xs text-muted-foreground">{item.serviceType}</p>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-2 border-t border-border pt-4">
          <p className="text-xs font-medium text-muted-foreground">Status colours</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(statusStyles) as CalendarAppointment["status"][]).map((status) => (
              <span
                key={status}
                className={cn("rounded border px-2 py-0.5 text-[10px] font-medium capitalize", statusStyles[status])}
              >
                {status.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function dayWithHour(day: Date, hour: number) {
  const next = startOfDay(day);
  next.setHours(hour, 0, 0, 0);
  return next;
}
