import { useMemo } from "react";
import { Plus } from "@untitledui/icons";
import { HabitTile } from "@/components/app/habit-tile";
import { useHabits, useLogs } from "@/hooks/use-shame";
import { deleteLog, logHabit } from "@/lib/actions";
import { todayKey } from "@/lib/days";
import { useToast } from "@/providers/toast-provider";
import type { Habit } from "@/types/shame";

interface HabitPickerProps {
    isEditing: boolean;
    onEdit: (habit: Habit | null) => void;
}

/** The main screen: one tap on a habit logs it. */
export function HabitPicker({ isEditing, onEdit }: HabitPickerProps) {
    const habits = useHabits();
    const today = todayKey();
    const todayLogs = useLogs(today, today);
    const { addToast } = useToast();

    const counts = useMemo(() => {
        const m = new Map<string, number>();
        for (const l of todayLogs) m.set(l.habitId, (m.get(l.habitId) ?? 0) + 1);
        return m;
    }, [todayLogs]);

    const press = async (habit: Habit) => {
        if (isEditing) {
            onEdit(habit);
            return;
        }
        navigator.vibrate?.(10);
        const log = await logHabit(habit.id);
        addToast(`${habit.emoji} ${habit.title} logged`, { label: "Undo", onAction: () => void deleteLog(log.id) });
    };

    if (!habits.length) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="text-5xl">🫣</div>
                <div>
                    <p className="text-lg font-semibold text-primary">Nothing to be ashamed of. Yet.</p>
                    <p className="mt-1 text-sm text-tertiary">Add the habits you want to keep track of.</p>
                </div>
                <button
                    type="button"
                    onClick={() => onEdit(null)}
                    className="cursor-pointer rounded-xl bg-brand-solid px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-solid_hover"
                >
                    Add a habit
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
            {habits.map((h) => (
                <HabitTile key={h.id} habit={h} todayCount={counts.get(h.id) ?? 0} isEditing={isEditing} onPress={() => void press(h)} />
            ))}
            <button
                type="button"
                onClick={() => onEdit(null)}
                className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-secondary text-quaternary outline-focus-ring hover:border-primary hover:text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                <Plus className="size-7" />
                <span className="text-sm font-semibold">New habit</span>
            </button>
        </div>
    );
}
