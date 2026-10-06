import { type TouchEvent, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { DaySheet } from "@/components/app/day-sheet";
import { useHabits, useLogs } from "@/hooks/use-raft";
import { WEEKDAYS, monthGrid, monthLabel, todayKey } from "@/lib/days";
import type { Habit } from "@/types/raft";
import { cx } from "@/utils/cx";

// Phones fit three small emoji a row in a cell; show three rows, then "+N".
const MAX_MARKS = 9;
/** Horizontal travel that turns a drag into a month change. */
const SWIPE = 50;

/** Month view: each day shows the emoji of what was logged, tap a day for details, swipe for another month. */
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

    // Direction of the last month change, so the new month slides in from that side.
    const [direction, setDirection] = useState(0);
    const shift = (months: number) => {
        setDirection(months);
        setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + months, 1));
    };
    const goToday = () => {
        const now = new Date();
        setDirection(now > anchor ? 1 : -1);
        setAnchor(now);
    };

    const touch = useRef<{ x: number; y: number } | null>(null);
    const onTouchStart = (e: TouchEvent) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        touch.current = null;
        if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) shift(dx < 0 ? 1 : -1);
    };
    const isCurrentMonth = anchor.getFullYear() === new Date().getFullYear() && anchor.getMonth() === new Date().getMonth();

    return (
        <div className="flex flex-1 touch-pan-y flex-col gap-3 px-2 py-4 sm:px-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className="flex items-center justify-between px-2 sm:px-0">
                <h2 className="text-lg font-semibold text-primary">{monthLabel(anchor)}</h2>
                <div className="flex items-center gap-1">
                    {!isCurrentMonth && (
                        <button
                            type="button"
                            onClick={goToday}
                            className="cursor-pointer rounded-lg px-2.5 py-1.5 text-sm font-semibold text-tertiary hover:bg-primary_hover"
                        >
                            Today
                        </button>
                    )}
                    <button
                        type="button"
                        aria-label="Previous month"
                        onClick={() => shift(-1)}
                        className="cursor-pointer rounded-lg p-2 text-fg-quaternary hover:bg-primary_hover"
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Next month"
                        onClick={() => shift(1)}
                        className="cursor-pointer rounded-lg p-2 text-fg-quaternary hover:bg-primary_hover"
                    >
                        <ChevronRight className="size-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-medium text-quaternary sm:gap-1">
                {WEEKDAYS.map((d) => (
                    <div key={d}>{d}</div>
                ))}
            </div>

            <div className="overflow-hidden">
                <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                    <motion.div
                        key={cells[0].key}
                        custom={direction}
                        initial={{ x: `${direction * 100}%`, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: `${direction * -100}%`, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="grid grid-cols-7 gap-0.5 sm:gap-1"
                    >
                        {cells.map((cell) => {
                            const day = byDay.get(cell.key);
                            const entries = day ? [...day.entries()].map(([id, n]) => [habitById.get(id)!, n] as [Habit, number]) : [];
                            entries.sort((a, b) => a[0].position - b[0].position);
                            const shown = entries.length > MAX_MARKS ? entries.slice(0, MAX_MARKS - 1) : entries;
                            return (
                                <button
                                    key={cell.key}
                                    type="button"
                                    onClick={() => setOpenDay(cell.key)}
                                    className={cx(
                                        "flex min-h-16 cursor-pointer flex-col items-center gap-0.5 rounded-lg px-0.5 pt-0.5 pb-1 outline-focus-ring hover:bg-primary_hover focus-visible:outline-2 sm:min-h-20 sm:rounded-xl sm:p-1",
                                        !cell.inMonth && "opacity-35",
                                        entries.length > 0 && "bg-secondary",
                                    )}
                                >
                                    <span
                                        className={cx(
                                            "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-secondary sm:size-6 sm:text-xs",
                                            cell.key === today && "bg-brand-solid text-white",
                                        )}
                                    >
                                        {cell.date.getDate()}
                                    </span>
                                    <span className="grid grid-cols-3 place-items-center gap-x-px text-[13px] leading-[1.15] sm:flex sm:flex-wrap sm:justify-center sm:gap-0.5 sm:text-base">
                                        {shown.map(([h]) => (
                                            <span key={h.id}>{h.emoji || "•"}</span>
                                        ))}
                                        {shown.length < entries.length && (
                                            <span className="text-[10px] font-semibold text-quaternary">+{entries.length - shown.length}</span>
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>

            <DaySheet day={openDay} onClose={() => setOpenDay(null)} />
        </div>
    );
}
