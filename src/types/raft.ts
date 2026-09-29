// Local (Dexie) shapes. Timestamps are epoch milliseconds.
// `syncedAt` is when this device last saw the record agree with the server;
// a record is dirty while `updatedAt > syncedAt` (or it was never synced).

export interface Habit {
    id: string;
    title: string;
    emoji: string;
    color: string;
    position: number;
    deletedAt?: number;
    updatedAt: number;
    syncedAt?: number;
}

export interface Log {
    id: string;
    habitId: string;
    loggedAt: number;
    /** Local calendar day of the tap, "YYYY-MM-DD". */
    day: string;
    deletedAt?: number;
    updatedAt: number;
    syncedAt?: number;
}
