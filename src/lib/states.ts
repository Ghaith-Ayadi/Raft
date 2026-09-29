import type { Habit, Log } from "@/types/timber";

/** The labels of the options a state log picked, in the state's order. Options since removed are skipped. */
export function pickedLabels(habit: Habit, log: Pick<Log, "values">): string[] {
    const values = new Set(log.values);
    return habit.options.filter((o) => values.has(o.id)).map((o) => o.label);
}
