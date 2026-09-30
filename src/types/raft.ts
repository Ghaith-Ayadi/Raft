// Local (Dexie) shapes. Timestamps are epoch milliseconds.
// `syncedAt` is when this device last saw the record agree with the server;
// a record is dirty while `updatedAt > syncedAt` (or it was never synced).

/** A habit is logged with one tap; a state is logged by picking one or more of its options. */
export type HabitKind = "habit" | "state";

export interface StateOption {
    id: string;
    label: string;
}

export interface Habit {
    id: string;
    kind: HabitKind;
    title: string;
    emoji: string;
    color: string;
    /** The choices of a state; empty for a habit. */
    options: StateOption[];
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
    /** Ids of the state options picked; empty for a habit. */
    values: string[];
    comment: string;
    deletedAt?: number;
    updatedAt: number;
    syncedAt?: number;
}
