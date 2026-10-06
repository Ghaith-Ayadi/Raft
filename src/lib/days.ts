// Calendar-day helpers. Everything is in the device's local time zone: a log
// belongs to the day on the wall clock of the phone that made it.

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" for a local date. */
export function dayKey(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): string {
    return dayKey(new Date());
}

/** Local noon of a day key: a safe instant for logs added to a past day. */
export function noonOf(key: string): Date {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d, 12);
}

/** The local instant of "HH:MM" on a day key. */
export function atTime(key: string, time: string): Date {
    const [y, m, d] = key.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    return new Date(y, m - 1, d, hh || 0, mm || 0);
}

/** "HH:MM" (24h) of an instant, the value an `<input type="time">` takes. */
export function timeValue(ms: number): string {
    const d = new Date(ms);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface MonthCell {
    key: string;
    date: Date;
    inMonth: boolean;
}

/** A Monday-first grid of whole weeks covering the month of `anchor`. */
export function monthGrid(anchor: Date): MonthCell[] {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = Math.ceil((offset + daysInMonth) / 7);

    const cells: MonthCell[] = [];
    for (let i = 0; i < weeks * 7; i++) {
        const date = new Date(year, month, 1 - offset + i);
        cells.push({ key: dayKey(date), date, inMonth: date.getMonth() === month });
    }
    return cells;
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function monthLabel(d: Date): string {
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function dayLabel(key: string): string {
    return noonOf(key).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

export function timeLabel(ms: number): string {
    return new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
