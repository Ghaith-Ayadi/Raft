import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Habit, Log } from "@/types/shame";

const EMPTY_HABITS: Habit[] = [];
const EMPTY_LOGS: Log[] = [];

/** Live, non-deleted habits in picker order. */
export function useHabits(): Habit[] {
    return (
        useLiveQuery(async () => {
            const all = await db.habits.orderBy("position").toArray();
            return all.filter((h) => !h.deletedAt);
        }) ?? EMPTY_HABITS
    );
}

/** Live, non-deleted logs whose day falls in [from, to] (inclusive "YYYY-MM-DD"). */
export function useLogs(from: string, to: string): Log[] {
    return (
        useLiveQuery(async () => {
            const logs = await db.logs.where("day").between(from, to, true, true).toArray();
            return logs.filter((l) => !l.deletedAt).sort((a, b) => a.loggedAt - b.loggedAt);
        }, [from, to]) ?? EMPTY_LOGS
    );
}
