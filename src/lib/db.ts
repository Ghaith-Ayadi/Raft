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
        // States and comments: give older local records the new fields.
        this.version(2)
            .stores({
                habits: "id, position, updatedAt",
                logs: "id, day, habitId, updatedAt",
                syncMeta: "key",
            })
            .upgrade(async (tx) => {
                await tx
                    .table("habits")
                    .toCollection()
                    .modify((h: Partial<Habit>) => {
                        h.kind ??= "habit";
                        h.options ??= [];
                    });
                await tx
                    .table("logs")
                    .toCollection()
                    .modify((l: Partial<Log>) => {
                        l.values ??= [];
                        l.comment ??= "";
                    });
            });
    }
}

export const db = new TimberDB();
