import { useEffect, useState } from "react";
import { Sheet } from "@/components/app/sheet";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { type HabitDraft, createHabit, deleteHabit, updateHabit } from "@/lib/actions";
import { COLORS, EMOJIS, tint } from "@/lib/palette";
import type { Habit } from "@/types/timber";
import { cx } from "@/utils/cx";

interface HabitEditorProps {
    isOpen: boolean;
    /** The habit being edited, or null to create one. */
    habit: Habit | null;
    onClose: () => void;
}

const blank = (): HabitDraft => ({ title: "", emoji: EMOJIS[0], color: COLORS[6] });

export function HabitEditor({ isOpen, habit, onClose }: HabitEditorProps) {
    const [draft, setDraft] = useState<HabitDraft>(blank);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setDraft(habit ? { title: habit.title, emoji: habit.emoji, color: habit.color } : blank());
        setConfirmDelete(false);
    }, [isOpen, habit]);

    const title = draft.title.trim();

    const save = async () => {
        if (!title) return;
        const next = { ...draft, title, emoji: draft.emoji.trim() };
        if (habit) await updateHabit(habit.id, next);
        else await createHabit(next);
        onClose();
    };

    const remove = async () => {
        if (!habit) return;
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        await deleteHabit(habit.id);
        onClose();
    };

    return (
        <Sheet isOpen={isOpen} onClose={onClose} title={habit ? "Edit habit" : "New habit"}>
            <form
                className="flex flex-col gap-5"
                onSubmit={(e) => {
                    e.preventDefault();
                    void save();
                }}
            >
                <div className="flex items-end gap-3">
                    <div
                        style={{ backgroundColor: tint(draft.color, 0.14), borderColor: tint(draft.color, 0.6) }}
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 text-2xl"
                    >
                        {draft.emoji || "•"}
                    </div>
                    <Input
                        className="flex-1"
                        label="Title"
                        placeholder="Drink water"
                        value={draft.title}
                        onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
                        autoFocus={!habit}
                        maxLength={100}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-secondary">Emoji</span>
                        <input
                            aria-label="Custom emoji"
                            value={draft.emoji}
                            onChange={(e) => setDraft((d) => ({ ...d, emoji: [...e.target.value].slice(-2).join("") }))}
                            placeholder="Type one"
                            className="w-24 rounded-lg border border-primary bg-primary px-2 py-1 text-center text-sm text-primary outline-focus-ring focus:outline-2"
                        />
                    </div>
                    <div className="grid grid-cols-10 gap-1">
                        {EMOJIS.map((e) => (
                            <button
                                key={e}
                                type="button"
                                onClick={() => setDraft((d) => ({ ...d, emoji: e }))}
                                className={cx(
                                    "flex aspect-square cursor-pointer items-center justify-center rounded-lg text-xl hover:bg-primary_hover",
                                    draft.emoji === e && "bg-secondary ring-2 ring-border-brand",
                                )}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-secondary">Color</span>
                    <div className="flex flex-wrap gap-2">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                aria-label={c}
                                onClick={() => setDraft((d) => ({ ...d, color: c }))}
                                style={{ backgroundColor: c }}
                                className={cx(
                                    "size-8 cursor-pointer rounded-full ring-offset-2 ring-offset-bg-primary",
                                    draft.color === c && "ring-2 ring-fg-primary",
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 pt-1">
                    {habit && (
                        <Button type="button" color={confirmDelete ? "primary-destructive" : "secondary-destructive"} size="lg" onClick={() => void remove()}>
                            {confirmDelete ? "Really delete?" : "Delete"}
                        </Button>
                    )}
                    <Button type="submit" color="primary" size="lg" className="flex-1" isDisabled={!title}>
                        {habit ? "Save" : "Add habit"}
                    </Button>
                </div>
            </form>
        </Sheet>
    );
}
