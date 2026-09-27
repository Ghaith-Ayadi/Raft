import { db } from "@/lib/db";
import { pb } from "@/lib/pocketbase";
import { type HabitRecord, type LogRecord, applyRemote, habitFromRecord, logFromRecord, runSync } from "@/lib/sync";

// Live updates from PocketBase over server-sent events, for the signed-in
// user's records only. Creates and updates go into Dexie (liveQuery carries
// them to the UI); every (re)connection runs a full sync to catch anything
// missed while the stream was down.

type Unsubscribe = () => Promise<void>;

let unsubscribers: Unsubscribe[] = [];

export async function startRealtime(userId: string) {
    await stopRealtime();
    const filter = pb.filter("user = {:u}", { u: userId });

    // Register the connect listener BEFORE the first subscription opens the
    // stream, or the initial PB_CONNECT fires with nobody listening.
    unsubscribers.push(await pb.realtime.subscribe("PB_CONNECT", () => void runSync()));

    unsubscribers.push(
        await pb.collection("habits").subscribe<HabitRecord>(
            "*",
            async (e) => {
                if (e.action === "delete") await db.habits.delete(e.record.id);
                else await applyRemote(db.habits, habitFromRecord(e.record));
            },
            { filter },
        ),
    );

    unsubscribers.push(
        await pb.collection("logs").subscribe<LogRecord>(
            "*",
            async (e) => {
                if (e.action === "delete") await db.logs.delete(e.record.id);
                else await applyRemote(db.logs, logFromRecord(e.record));
            },
            { filter },
        ),
    );

    // Whatever the connect event did, the first sync after sign-in must happen.
    void runSync();
}

export async function stopRealtime() {
    const current = unsubscribers;
    unsubscribers = [];
    await Promise.all(current.map((u) => u().catch(() => {})));
}
