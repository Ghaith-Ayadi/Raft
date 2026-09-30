import { useEffect, useState } from "react";
import { Plus, XClose } from "@untitledui/icons";
import { Sheet } from "@/components/app/sheet";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { type HabitDraft, createHabit, deleteHabit, updateHabit } from "@/lib/actions";
import { COLORS, tint } from "@/lib/palette";
import { newId } from "@/lib/pocketbase";
import type { Habit, HabitKind } from "@/types/raft";
import { cx } from "@/utils/cx";

interface HabitEditorProps {
    isOpen: boolean;
    /** The habit being edited, or null to create one. */
    habit: Habit | null;
    onClose: () => void;
}

const blank = (): HabitDraft => ({ kind: "habit", title: "", emoji: "", color: COLORS[6], options: [] });

const KINDS: { id: HabitKind; label: string; hint: string }[] = [
    { id: "habit", label: "Habit", hint: "One tap logs it." },
    { id: "state", label: "State", hint: "Pick one or more options each time you log it." },
];

export function HabitEditor({ isOpen, habit, onClose }: HabitEditorProps) {
    const [draft, setDraft] = useState<HabitDraft>(blank);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setDraft(habit ? { kind: habit.kind, title: habit.title, emoji: habit.emoji, color: habit.color, options: habit.options } : blank());
        setConfirmDelete(false);
    }, [isOpen, habit]);

    const title = draft.title.trim();
    const isState = draft.kind === "state";
    const options = draft.options.map((o) => ({ ...o, label: o.label.trim() })).filter((o) => o.label);
    const canSave = !!title && (!isState || options.length > 0);

    const setOption = (id: string, label: string) => setDraft((d) => ({ ...d, options: d.options.map((o) => (o.id === id ? { ...o, label } : o)) }));
    const removeOption = (id: string) => setDraft((d) => ({ ...d, options: d.options.filter((o) => o.id !== id) }));
    const addOption = () => setDraft((d) => ({ ...d, options: [...d.options, { id: newId(), label: "" }] }));

    const save = async () => {
        if (!canSave) return;
        const next = { ...draft, title, emoji: draft.emoji.trim(), options: isState ? options : [] };
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
        <Sheet isOpen={isOpen} onClose={onClose} title={habit ? `Edit ${isState ? "state" : "habit"}` : `New ${isState ? "state" : "habit"}`}>
            <form
                className="flex flex-col gap-5"
                onSubmit={(e) => {
                    e.preventDefault();
                    void save();
                }}
            >
                {!habit && (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex gap-1 rounded-xl bg-secondary p-1">
                            {KINDS.map((k) => (
                                <button
                                    key={k.id}
                                    type="button"
                                    aria-pressed={draft.kind === k.id}
                                    onClick={() =>
                                        setDraft((d) => ({
                                            ...d,
                                            kind: k.id,
                                            options: k.id === "state" && !d.options.length ? [{ id: newId(), label: "" }] : d.options,
                                        }))
                                    }
                                    className={cx(
                                        "flex-1 cursor-pointer rounded-lg py-1.5 text-sm font-semibold",
                                        draft.kind === k.id ? "bg-primary text-primary shadow-xs" : "text-quaternary hover:text-tertiary",
                                    )}
                                >
                                    {k.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-tertiary">{KINDS.find((k) => k.id === draft.kind)?.hint}</p>
                    </div>
                )}

                <div className="flex items-end gap-3">
                    <label className="flex shrink-0 flex-col gap-1.5">
                        <span className="text-sm font-medium text-secondary">Emoji</span>
                        <input
                            value={draft.emoji}
                            onChange={(e) => setDraft((d) => ({ ...d, emoji: e.target.value }))}
                            placeholder="•"
                            maxLength={32}
                            autoComplete="off"
                            style={{ backgroundColor: tint(draft.color, 0.14), borderColor: tint(draft.color, 0.6) }}
                            className="h-11 w-16 rounded-xl border-2 text-center text-2xl text-primary outline-focus-ring placeholder:text-placeholder focus:outline-2"
                        />
                    </label>
                    <Input
                        className="flex-1"
                        label="Title"
                        placeholder={isState ? "Mood" : "Drink water"}
                        value={draft.title}
                        onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
                        autoFocus={!habit}
                        maxLength={100}
                    />
                </div>

                {isState && (
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-secondary">Options</span>
                        {draft.options.map((o, i) => (
                            <div key={o.id} className="flex items-center gap-2">
                                <Input
                                    className="flex-1"
                                    aria-label={`Option ${i + 1}`}
                                    placeholder={["😊 Happy", "😐 Meh", "😢 Sad"][i % 3]}
                                    value={o.label}
                                    onChange={(v) => setOption(o.id, v)}
                                    maxLength={60}
                                />
                                <button
                                    type="button"
                                    aria-label="Remove option"
                                    onClick={() => removeOption(o.id)}
                                    className="cursor-pointer rounded-lg p-2 text-fg-quaternary hover:bg-primary_hover hover:text-fg-quaternary_hover"
                                >
                                    <XClose className="size-4" />
                                </button>
                            </div>
                        ))}
                        <Button type="button" color="link-color" size="sm" iconLeading={Plus} className="self-start" onClick={addOption}>
                            Add option
                        </Button>
                    </div>
                )}

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
                    <Button type="submit" color="primary" size="lg" className="flex-1" isDisabled={!canSave}>
                        {habit ? "Save" : isState ? "Add state" : "Add habit"}
                    </Button>
                </div>
            </form>
        </Sheet>
    );
}
