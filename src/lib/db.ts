import Dexie, { type Table } from "dexie";
import type { Habit, Log } from "@/types/raft";

interface SyncMetaRow {
    key: string;
    value: unknown;
}

class RaftDB extends Dexie {
    habits!: Table<Habit, string>;
    logs!: Table<Log, string>;
    syncMeta!: Table<SyncMetaRow, string>;

    constructor() {
        super("raft");
        this.version(1).stores({
            habits: "id, position, updatedAt",
            logs: "id, day, habitId, updatedAt",
            syncMeta: "key",
        });
    }
}

export const db = new RaftDB();
