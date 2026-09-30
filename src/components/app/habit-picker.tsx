import { useMemo, useState } from "react";
import { Plus } from "@untitledui/icons";
import { CommentSheet } from "@/components/app/comment-sheet";
import { HabitTile } from "@/components/app/habit-tile";
import { StateSheet } from "@/components/app/state-sheet";
import { useHabits, useLogs } from "@/hooks/use-raft";
import { deleteLog, logHabit } from "@/lib/actions";
import { todayKey } from "@/lib/days";
import { pickedLabels } from "@/lib/states";
import { useToast } from "@/providers/toast-provider";
import type { Habit } from "@/types/raft";

interface HabitPickerProps {
    isEditing: boolean;
    onEdit: (habit: Habit | null) => void;
}

/** The main screen: one tap on a habit logs it; a state asks which options first. */
export function HabitPicker({ isEditing, onEdit }: HabitPickerProps) {
    const habits = useHabits();
    const today = todayKey();
    const todayLogs = useLogs(today, today);
    const { addToast } = useToast();
    const [stateFor, setStateFor] = useState<Habit | null>(null);
    const [commentFor, setCommentFor] = useState<{ logId: string; comment: string; title: string } | null>(null);

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
        if (habit.kind === "state") {
            setStateFor(habit);
            return;
        }
        await log(habit);
    };

    const log = async (habit: Habit, values: string[] = []) => {
        navigator.vibrate?.(10);
        const entry = await logHabit(habit.id, undefined, values);
        const name = `${habit.emoji} ${habit.title}`.trim();
        const picked = pickedLabels(habit, entry);
        addToast(picked.length ? `${name}: ${picked.join(", ")}` : `${name} logged`, [
            { label: "Undo", onAction: () => void deleteLog(entry.id) },
            { label: "Comment", onAction: () => setCommentFor({ logId: entry.id, comment: "", title: `Comment on ${name}` }) },
        ]);
    };

    const sheets = (
        <>
            <StateSheet
                habit={stateFor}
                onClose={() => setStateFor(null)}
                onLog={(values) => {
                    if (stateFor) void log(stateFor, values);
                    setStateFor(null);
                }}
            />
            <CommentSheet target={commentFor} onClose={() => setCommentFor(null)} />
        </>
    );

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
                {sheets}
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
                <span className="text-sm font-semibold">New</span>
            </button>
            {sheets}
        </div>
    );
}
