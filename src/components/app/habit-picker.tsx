import { useMemo, useState } from "react";
import { Plus } from "@untitledui/icons";
import { CommentSheet } from "@/components/app/comment-sheet";
import { HabitRow } from "@/components/app/habit-row";
import { LogList } from "@/components/app/log-list";
import { StateSheet } from "@/components/app/state-sheet";
import { useHabits, useLogs } from "@/hooks/use-raft";
import { deleteLog, logHabit } from "@/lib/actions";
import { todayKey } from "@/lib/days";
import { pickedLabels } from "@/lib/states";
import { useToast } from "@/providers/toast-provider";
import type { Habit } from "@/types/raft";

interface HabitPickerProps {
    onEdit: (habit: Habit | null) => void;
}

/** The main screen: one tap on a habit logs it (a state asks which options first), a long press edits it. Today's logs sit below. */
export function HabitPicker({ onEdit }: HabitPickerProps) {
    const habits = useHabits();
    const today = todayKey();
    const todayLogs = useLogs(today, today);
    const { addToast } = useToast();
    const [stateFor, setStateFor] = useState<Habit | null>(null);
    const [commentFor, setCommentFor] = useState<{ logId: string; comment: string; title: string } | null>(null);

    const habitById = useMemo(() => new Map(habits.map((h) => [h.id, h])), [habits]);
    const visibleToday = todayLogs.filter((l) => habitById.has(l.habitId));

    const press = async (habit: Habit) => {
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
        <div className="flex flex-col gap-6 p-4">
            <div className="flex flex-col gap-2">
                {habits.map((h) => (
                    <HabitRow key={h.id} habit={h} onPress={() => void press(h)} onLongPress={() => onEdit(h)} />
                ))}
                <button
                    type="button"
                    onClick={() => onEdit(null)}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-secondary px-3 py-2.5 text-quaternary outline-focus-ring hover:border-primary hover:text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    <span className="flex size-11 items-center justify-center">
                        <Plus className="size-6" />
                    </span>
                    <span className="text-base font-semibold">New habit</span>
                </button>
                <p className="px-1 text-xs text-quaternary">Tap to log. Hold to edit.</p>
            </div>

            <section className="flex flex-col gap-2 border-t border-secondary pt-4">
                <h2 className="px-1 text-sm font-semibold text-secondary">Today</h2>
                {visibleToday.length ? (
                    <LogList logs={visibleToday} habitById={habitById} />
                ) : (
                    <p className="px-1 text-sm text-tertiary">Nothing logged yet.</p>
                )}
            </section>
            {sheets}
        </div>
    );
}
