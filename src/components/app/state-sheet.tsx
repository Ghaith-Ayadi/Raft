import { useEffect, useState } from "react";
import { Check } from "@untitledui/icons";
import { Sheet } from "@/components/app/sheet";
import { Button } from "@/components/base/buttons/button";
import { tint } from "@/lib/palette";
import type { Habit } from "@/types/timber";
import { cx } from "@/utils/cx";

interface StateSheetProps {
    /** The state being logged, or null when closed. */
    habit: Habit | null;
    onClose: () => void;
    /** Called with the picked option ids (never empty). */
    onLog: (values: string[]) => void;
}

/** Pick one or more of a state's options, then log them together. */
export function StateSheet({ habit, onClose, onLog }: StateSheetProps) {
    const [picked, setPicked] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (habit) setPicked(new Set());
    }, [habit]);

    const toggle = (id: string) =>
        setPicked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const options = habit?.options ?? [];

    return (
        <Sheet isOpen={habit !== null} onClose={onClose} title={habit ? `${habit.emoji} ${habit.title}`.trim() : ""}>
            <div className="flex flex-wrap gap-2">
                {options.map((o) => {
                    const on = picked.has(o.id);
                    return (
                        <button
                            key={o.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggle(o.id)}
                            style={habit ? { backgroundColor: tint(habit.color, on ? 0.9 : 0.12), borderColor: tint(habit.color, on ? 1 : 0.4) } : undefined}
                            className={cx(
                                "flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold select-none",
                                on ? "text-white" : "text-primary",
                            )}
                        >
                            {on && <Check className="size-4" />}
                            {o.label}
                        </button>
                    );
                })}
            </div>
            <Button color="primary" size="lg" isDisabled={picked.size === 0} onClick={() => onLog(options.filter((o) => picked.has(o.id)).map((o) => o.id))}>
                Log
            </Button>
        </Sheet>
    );
}
