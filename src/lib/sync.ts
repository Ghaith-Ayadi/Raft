import type { Table } from "dexie";
import { ClientResponseError } from "pocketbase";
import { db } from "@/lib/db";
import { pb, pbDateToMs } from "@/lib/pocketbase";
import type { Habit, Log } from "@/types/raft";

// Sync between the local Dexie cache and PocketBase.
//
// Dexie is what the UI reads, so a tap is instant and works offline; the
// server is the source of truth. Local writes bump `updatedAt` and schedule a
// sync, which pushes dirty records (habits before logs, so a log's habit
// exists server-side first) and then pulls anything whose `updated` is newer
// than the last pull.
//
// Ids are minted on the client (`newId()`), so push is "create if never
// synced, else update", with a fallback to the other when the server
// disagrees. This file and realtime.ts are the only ones that know the wire format.

const DEBOUNCE_MS = 400;
const CLEANUP_DAYS = 30;

let currentUserId: string | null = null;
let syncInFlight = false;
let syncAgain = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let onSyncComplete: (() => void) | null = null;

/** Records as PocketBase returns them. Empty text is "", empty number 0, empty date "". */
export interface HabitRecord {
    id: string;
    user: string;
    title: string;
    emoji: string;
    color: string;
    position: number;
    deleted_at: string;
    created: string;
    updated: string;
}

export interface LogRecord {
    id: string;
    user: string;
    habit: string;
    logged_at: string;
    day: string;
    deleted_at: string;
    created: string;
    updated: string;
}

const isoOrEmpty = (ms: number | undefined) => (ms ? new Date(ms).toISOString() : "");

function habitToRecord(h: Habit, userId: string) {
    return {
        id: h.id,
        user: userId,
        title: h.title,
        emoji: h.emoji,
        color: h.color,
        position: h.position,
        deleted_at: isoOrEmpty(h.deletedAt),
    };
}

export function habitFromRecord(r: HabitRecord): Habit {
    return {
        id: r.id,
        title: r.title,
        emoji: r.emoji,
        color: r.color,
        position: r.position ?? 0,
        deletedAt: pbDateToMs(r.deleted_at) ?? undefined,
        updatedAt: pbDateToMs(r.updated) ?? Date.now(),
    };
}

function logToRecord(l: Log, userId: string) {
    return {
        id: l.id,
        user: userId,
        habit: l.habitId,
        logged_at: new Date(l.loggedAt).toISOString(),
        day: l.day,
        deleted_at: isoOrEmpty(l.deletedAt),
    };
}

export function logFromRecord(r: LogRecord): Log {
    return {
        id: r.id,
        habitId: r.habit,
        loggedAt: pbDateToMs(r.logged_at) ?? 0,
        day: r.day,
        deletedAt: pbDateToMs(r.deleted_at) ?? undefined,
        updatedAt: pbDateToMs(r.updated) ?? Date.now(),
    };
}

const isDirty = (x: { updatedAt: number; syncedAt?: number } | undefined) => !!x && (!x.syncedAt || x.updatedAt > x.syncedAt);

export function setSyncUser(userId: string | null) {
    currentUserId = userId;
}

export function setSyncListener(listener: (() => void) | null) {
    onSyncComplete = listener;
}

export function scheduleSync() {
    if (!currentUserId) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        void runSync();
    }, DEBOUNCE_MS);
}

export async function runSync(): Promise<void> {
    if (!currentUserId) return;
    if (syncInFlight) {
        // A write landed mid-sync; go round once more when this pass ends.
        syncAgain = true;
        return;
    }
    syncInFlight = true;
    try {
        do {
            syncAgain = false;
            const userId = currentUserId;
            if (!userId) break;
            await push(db.habits, "habits", (h) => habitToRecord(h, userId));
            await push(db.logs, "logs", (l) => logToRecord(l, userId));
            await pull(db.habits, "habits", "lastPullHabits", userId, habitFromRecord);
            await pull(db.logs, "logs", "lastPullLogs", userId, logFromRecord);
            await cleanupOldDeletes();
        } while (syncAgain);
        onSyncComplete?.();
    } catch (err) {
        console.error("Sync failed:", err);
    } finally {
        syncInFlight = false;
    }
}

const status = (err: unknown) => (err instanceof ClientResponseError ? err.status : 0);

async function push<T extends Habit | Log>(table: Table<T, string>, collection: string, toRecord: (x: T) => Record<string, unknown>) {
    const pending = (await table.toArray()).filter(isDirty);
    const col = pb.collection(collection);

    for (const item of pending) {
        const body = toRecord(item);
        try {
            if (item.syncedAt) {
                // Known to the server. A 404 means it was purged there: recreate.
                await col.update(item.id, body).catch((err) => {
                    if (status(err) === 404) return col.create(body);
                    throw err;
                });
            } else {
                // Never confirmed. A 400 here is usually "id already exists"
                // (an earlier create whose response was lost): update instead.
                await col.create(body).catch((err) => {
                    if (status(err) === 400) return col.update(item.id, body);
                    throw err;
                });
            }
        } catch (err) {
            // A log whose habit has not landed yet fails here and retries next sync.
            console.error(`Push failed: ${collection}/${item.id}`, err);
            continue;
        }
        // Only mark synced if nothing changed locally while the request was out.
        const now = Date.now();
        await table
            .where("id")
            .equals(item.id)
            .modify((x) => {
                if (x.updatedAt === item.updatedAt) x.syncedAt = Math.max(now, x.updatedAt);
            });
    }
}

async function pull<T extends Habit | Log, R extends { updated: string }>(
    table: Table<T, string>,
    collection: string,
    metaKey: string,
    userId: string,
    fromRecord: (r: R) => T,
) {
    const meta = await db.syncMeta.get(metaKey);
    const since = typeof meta?.value === "string" ? meta.value : "1970-01-01T00:00:00.000Z";

    const records = await pb.collection(collection).getFullList<R>({
        filter: pb.filter("user = {:u} && updated > {:since}", { u: userId, since: new Date(since) }),
        sort: "updated",
        batch: 500,
    });
    if (!records.length) return;

    let maxMs = Date.parse(since);
    await db.transaction("rw", table, async () => {
        for (const r of records) {
            const ms = pbDateToMs(r.updated) ?? 0;
            if (ms > maxMs) maxMs = ms;
            await applyRemote(table, fromRecord(r));
        }
    });
    await db.syncMeta.put({ key: metaKey, value: new Date(maxMs).toISOString() });
}

/** Write a server copy locally unless this device holds a newer unpushed edit. */
export async function applyRemote<T extends Habit | Log>(table: Table<T, string>, remote: T) {
    const local = await table.get(remote.id);
    if (isDirty(local)) return;
    await table.put({ ...remote, syncedAt: Math.max(Date.now(), remote.updatedAt) });
}

async function cleanupOldDeletes() {
    const cutoff = Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000;
    const stale = <T extends { deletedAt?: number; updatedAt: number; syncedAt?: number }>(x: T) =>
        !!x.deletedAt && x.deletedAt < cutoff && !isDirty(x);
    const habits = await db.habits.filter(stale).primaryKeys();
    const logs = await db.logs.filter(stale).primaryKeys();
    if (habits.length) await db.habits.bulkDelete(habits);
    if (logs.length) await db.logs.bulkDelete(logs);
}

/** Forget everything local: used on sign-out so the next account starts clean. */
export async function resetLocalData() {
    await db.transaction("rw", db.habits, db.logs, db.syncMeta, async () => {
        await db.habits.clear();
        await db.logs.clear();
        await db.syncMeta.clear();
    });
}
