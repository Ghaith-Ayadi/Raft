import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "@untitledui/icons";
import { DaySheet } from "@/components/app/day-sheet";
import { useHabits, useLogs } from "@/hooks/use-raft";
import { WEEKDAYS, monthGrid, monthLabel, todayKey } from "@/lib/days";
import type { Habit } from "@/types/raft";
import { cx } from "@/utils/cx";

const MAX_MARKS = 4;

/** Month view: each day shows the emoji of what was logged, tap a day for details. */
export function MonthCalendar() {
    const [anchor, setAnchor] = useState(() => new Date());
    const [openDay, setOpenDay] = useState<string | null>(null);

    const cells = useMemo(() => monthGrid(anchor), [anchor]);
    const habits = useHabits();
    const logs = useLogs(cells[0].key, cells[cells.length - 1].key);
    const today = todayKey();

    const habitById = useMemo(() => new Map(habits.map((h) => [h.id, h])), [habits]);

    // day -> habits logged that day with counts, in picker order.
    const byDay = useMemo(() => {
        const m = new Map<string, Map<string, number>>();
        for (const l of logs) {
            if (!habitById.has(l.habitId)) continue;
            const day = m.get(l.day) ?? new Map<string, number>();
            day.set(l.habitId, (day.get(l.habitId) ?? 0) + 1);
            m.set(l.day, day);
        }
        return m;
    }, [logs, habitById]);

    const shift = (months: number) => setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + months, 1));
    const isCurrentMonth = anchor.getFullYear() === new Date().getFullYear() && anchor.getMonth() === new Date().getMonth();

    return (
        <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">{monthLabel(anchor)}</h2>
                <div className="flex items-center gap-1">
                    {!isCurrentMonth && (
                        <button type="button" onClick={() => setAnchor(new Date())} className="cursor-pointer rounded-lg px-2.5 py-1.5 text-sm font-semibold text-tertiary hover:bg-primary_hover">
                            Today
                        </button>
                    )}
                    <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className="cursor-pointer rounded-lg p-2 text-fg-quaternary hover:bg-primary_hover">
                        <ChevronLeft className="size-5" />
                    </button>
                    <button type="button" aria-label="Next month" onClick={() => shift(1)} className="cursor-pointer rounded-lg p-2 text-fg-quaternary hover:bg-primary_hover">
                        <ChevronRight className="size-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-quaternary">
                {WEEKDAYS.map((d) => (
                    <div key={d}>{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {cells.map((cell) => {
                    const day = byDay.get(cell.key);
                    const entries = day ? [...day.entries()].map(([id, n]) => [habitById.get(id)!, n] as [Habit, number]) : [];
                    entries.sort((a, b) => a[0].position - b[0].position);
                    return (
                        <button
                            key={cell.key}
                            type="button"
                            onClick={() => setOpenDay(cell.key)}
                            className={cx(
                                "flex aspect-[4/5] cursor-pointer flex-col items-center gap-0.5 rounded-xl p-1 outline-focus-ring hover:bg-primary_hover focus-visible:outline-2 sm:aspect-square",
                                !cell.inMonth && "opacity-35",
                                entries.length > 0 && "bg-secondary",
                            )}
                        >
                            <span
                                className={cx(
                                    "flex size-6 items-center justify-center rounded-full text-xs font-semibold text-secondary",
                                    cell.key === today && "bg-brand-solid text-white",
                                )}
                            >
                                {cell.date.getDate()}
                            </span>
                            <span className="flex flex-wrap justify-center gap-px text-sm leading-tight sm:text-base">
                                {entries.slice(0, MAX_MARKS).map(([h]) => (
                                    <span key={h.id}>{h.emoji || "•"}</span>
                                ))}
                                {entries.length > MAX_MARKS && <span className="text-[10px] font-semibold text-quaternary">+{entries.length - MAX_MARKS}</span>}
                            </span>
                        </button>
                    );
                })}
            </div>

            <DaySheet day={openDay} onClose={() => setOpenDay(null)} />
        </div>
    );
}
