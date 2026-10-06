import { useState } from "react";
import { LogList } from "@/components/app/log-list";
import { Sheet } from "@/components/app/sheet";
import { StateSheet } from "@/components/app/state-sheet";
import { useHabits, useLogs } from "@/hooks/use-raft";
import { logHabit } from "@/lib/actions";
import { dayLabel } from "@/lib/days";
import { tint } from "@/lib/palette";
import type { Habit } from "@/types/raft";

interface DaySheetProps {
    day: string | null;
    onClose: () => void;
}

/** One day's logs, with times, comments, removal and back-filling. */
export function DaySheet({ day, onClose }: DaySheetProps) {
    const habits = useHabits();
    const logs = useLogs(day ?? "", day ?? "");
    const habitById = new Map(habits.map((h) => [h.id, h]));
    const visible = logs.filter((l) => habitById.has(l.habitId));
    const [stateFor, setStateFor] = useState<Habit | null>(null);

    const backfill = (h: Habit) => {
        if (!day) return;
        if (h.kind === "state") setStateFor(h);
        else void logHabit(h.id, day);
    };

    return (
        <Sheet isOpen={day !== null} onClose={onClose} title={day ? dayLabel(day) : ""}>
            {visible.length ? <LogList logs={visible} habitById={habitById} /> : <p className="text-sm text-tertiary">Nothing logged.</p>}

            {habits.length > 0 && day && (
                <div className="flex flex-col gap-2 border-t border-secondary pt-4">
                    <span className="text-xs font-medium text-quaternary">Add to this day</span>
                    <div className="flex flex-wrap gap-2">
                        {habits.map((h) => (
                            <button
                                key={h.id}
                                type="button"
                                onClick={() => backfill(h)}
                                style={{ backgroundColor: tint(h.color, 0.14), borderColor: tint(h.color, 0.4) }}
                                className="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium text-primary"
                            >
                                <span>{h.emoji || "•"}</span>
                                {h.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <StateSheet
                habit={stateFor}
                onClose={() => setStateFor(null)}
                onLog={(values) => {
                    if (stateFor && day) void logHabit(stateFor.id, day, values);
                    setStateFor(null);
                }}
            />
        </Sheet>
    );
}
