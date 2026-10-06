import { motion } from "motion/react";
import { useLongPress } from "@/hooks/use-long-press";
import { tint } from "@/lib/palette";
import type { Habit } from "@/types/raft";

interface HabitRowProps {
    habit: Habit;
    onPress: () => void;
    onLongPress: () => void;
}

/** One habit on the home screen: tap to log, hold to edit. */
export function HabitRow({ habit, onPress, onLongPress }: HabitRowProps) {
    const press = useLongPress(onPress, onLongPress);
    return (
        <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 600, damping: 30 }}
            {...press}
            style={{ backgroundColor: tint(habit.color, 0.12), borderColor: tint(habit.color, 0.32) }}
            className="flex w-full cursor-pointer touch-manipulation items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left outline-focus-ring select-none [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
            <span
                style={{ backgroundColor: tint(habit.color, 0.22) }}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl leading-none"
            >
                {habit.emoji || "•"}
            </span>
            <span className="min-w-0 flex-1 truncate text-base font-semibold text-primary">{habit.title}</span>
            {habit.kind === "state" && <span className="shrink-0 text-xs font-medium text-quaternary">{habit.options.length} options</span>}
        </motion.button>
    );
}
