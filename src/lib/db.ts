import Dexie, { type Table } from "dexie";
import type { Habit, Log } from "@/types/timber";

interface SyncMetaRow {
    key: string;
    value: unknown;
}

class TimberDB extends Dexie {
    habits!: Table<Habit, string>;
    logs!: Table<Log, string>;
    syncMeta!: Table<SyncMetaRow, string>;

    constructor() {
        super("timber");
        this.version(1).stores({
            habits: "id, position, updatedAt",
            logs: "id, day, habitId, updatedAt",
            syncMeta: "key",
        });
    }
}

export const db = new TimberDB();
