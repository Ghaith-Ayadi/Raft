import { db } from "@/lib/db";
import { dayKey, noonOf } from "@/lib/days";
import { newId } from "@/lib/pocketbase";
import { scheduleSync } from "@/lib/sync";
import type { Habit, Log } from "@/types/raft";

// Every local write goes through here: touch Dexie, bump `updatedAt`, schedule
// a sync. The UI never waits on the network.

export type HabitDraft = Pick<Habit, "kind" | "title" | "emoji" | "color" | "options">;

export async function createHabit(draft: HabitDraft): Promise<Habit> {
    const last = await db.habits.orderBy("position").last();
    const habit: Habit = { id: newId(), ...draft, position: (last?.position ?? 0) + 1, updatedAt: Date.now() };
    await db.habits.put(habit);
    scheduleSync();
    return habit;
}

export async function updateHabit(id: string, patch: Partial<HabitDraft>) {
    await db.habits.update(id, { ...patch, updatedAt: Date.now() });
    scheduleSync();
}

export async function deleteHabit(id: string) {
    const now = Date.now();
    await db.habits.update(id, { deletedAt: now, updatedAt: now });
    scheduleSync();
}

/** Log a habit (or a state, with the option ids picked) now, or on a given past day (at local noon). */
export async function logHabit(habitId: string, day?: string, values: string[] = []): Promise<Log> {
    const at = day ? noonOf(day) : new Date();
    const log: Log = { id: newId(), habitId, loggedAt: at.getTime(), day: day ?? dayKey(at), values, comment: "", updatedAt: Date.now() };
    await db.logs.put(log);
    scheduleSync();
    return log;
}

export async function setLogComment(id: string, comment: string) {
    await db.logs.update(id, { comment: comment.trim(), updatedAt: Date.now() });
    scheduleSync();
}

export async function deleteLog(id: string) {
    const now = Date.now();
    await db.logs.update(id, { deletedAt: now, updatedAt: now });
    scheduleSync();
}

export async function restoreLog(id: string) {
    await db.logs.update(id, { deletedAt: undefined, updatedAt: Date.now() });
    scheduleSync();
}
