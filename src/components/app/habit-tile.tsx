import { motion } from "motion/react";
import { tint } from "@/lib/palette";
import type { Habit } from "@/types/shame";
import { cx } from "@/utils/cx";

interface HabitTileProps {
    habit: Habit;
    todayCount: number;
    isEditing: boolean;
    onPress: () => void;
}

export function HabitTile({ habit, todayCount, isEditing, onPress }: HabitTileProps) {
    return (
        <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 600, damping: 30 }}
            onClick={onPress}
            style={{ backgroundColor: tint(habit.color, 0.14), borderColor: tint(habit.color, todayCount ? 0.9 : 0.28) }}
            className={cx(
                "relative flex aspect-square cursor-pointer touch-manipulation flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 text-center outline-focus-ring select-none focus-visible:outline-2 focus-visible:outline-offset-2",
                isEditing && "animate-pulse",
            )}
        >
            <span className="text-4xl leading-none">{habit.emoji || "•"}</span>
            <span className="line-clamp-2 text-sm font-semibold text-primary">{habit.title}</span>
            {todayCount > 0 && (
                <span
                    style={{ backgroundColor: habit.color }}
                    className="absolute top-2 right-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
                >
                    {todayCount > 1 ? `×${todayCount}` : "✓"}
                </span>
            )}
        </motion.button>
    );
}
