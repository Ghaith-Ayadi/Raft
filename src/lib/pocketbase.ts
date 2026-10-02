import PocketBase, { type RecordModel } from "pocketbase";

// The backend: one PocketBase instance per app on Bedrock (Ghaith-Ayadi/Bedrock).
const url = import.meta.env.VITE_PB_URL;

if (!url) {
    throw new Error("Missing VITE_PB_URL");
}

export const pb = new PocketBase(url);

// Sync fires overlapping list requests. The SDK's default cancels the earlier
// one, which the sync layer would read as a failure.
pb.autoCancellation(false);

export type PbUser = RecordModel & {
    email: string;
    name?: string;
    avatar?: string;
};

/** The user's avatar as a URL; `avatar` itself is only a PocketBase file name. */
export function avatarUrl(user: PbUser): string | null {
    return user.avatar ? pb.files.getURL(user, user.avatar, { thumb: "100x100" }) : null;
}

/** Up to two initials from the name, else the first letter of the email. */
export function userInitials(user: PbUser): string {
    const words = (user.name ?? "").trim().split(/\s+/).filter(Boolean);
    if (words.length) return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
    return (user.email?.[0] ?? "?").toUpperCase();
}

/** PocketBase date strings are "YYYY-MM-DD HH:mm:ss.sssZ"; Safari's Date needs the T. */
export function pbDateToMs(value: string | null | undefined): number | null {
    if (!value) return null;
    const ms = Date.parse(value.includes("T") ? value : value.replace(" ", "T"));
    return Number.isNaN(ms) ? null : ms;
}

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * A PocketBase record id (15 chars, [a-z0-9]) minted here, so a record has its
 * final id before it ever reaches the server and logs can reference habits offline.
 */
export function newId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(15));
    let id = "";
    for (const b of bytes) id += ID_ALPHABET[b % ID_ALPHABET.length];
    return id;
}
