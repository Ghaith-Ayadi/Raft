import { Trash01 } from "@untitledui/icons";
import { Sheet } from "@/components/app/sheet";
import { useHabits, useLogs } from "@/hooks/use-shame";
import { deleteLog, logHabit, restoreLog } from "@/lib/actions";
import { dayLabel, timeLabel } from "@/lib/days";
import { tint } from "@/lib/palette";
import { useToast } from "@/providers/toast-provider";

interface DaySheetProps {
    day: string | null;
    onClose: () => void;
}

/** One day's logs, with removal and back-filling. */
export function DaySheet({ day, onClose }: DaySheetProps) {
    const habits = useHabits();
    const logs = useLogs(day ?? "", day ?? "");
    const habitById = new Map(habits.map((h) => [h.id, h]));
    const visible = logs.filter((l) => habitById.has(l.habitId));
    const { addToast } = useToast();

    const remove = async (id: string) => {
        await deleteLog(id);
        addToast("Log removed", { label: "Undo", onAction: () => void restoreLog(id) });
    };

    return (
        <Sheet isOpen={day !== null} onClose={onClose} title={day ? dayLabel(day) : ""}>
            {visible.length ? (
                <ul className="flex flex-col gap-1">
                    {visible.map((l) => {
                        const h = habitById.get(l.habitId)!;
                        return (
                            <li key={l.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-primary_hover">
                                <span style={{ backgroundColor: tint(h.color, 0.18) }} className="flex size-9 items-center justify-center rounded-lg text-lg">
                                    {h.emoji || "•"}
                                </span>
                                <span className="flex-1 truncate text-sm font-medium text-primary">{h.title}</span>
                                <span className="text-xs text-quaternary">{timeLabel(l.loggedAt)}</span>
                                <button
                                    type="button"
                                    aria-label={`Remove ${h.title}`}
                                    onClick={() => void remove(l.id)}
                                    className="cursor-pointer rounded-lg p-1.5 text-fg-quaternary hover:bg-error-primary hover:text-fg-error-primary"
                                >
                                    <Trash01 className="size-4" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-sm text-tertiary">Nothing logged.</p>
            )}

            {habits.length > 0 && day && (
                <div className="flex flex-col gap-2 border-t border-secondary pt-4">
                    <span className="text-xs font-medium text-quaternary">Add to this day</span>
                    <div className="flex flex-wrap gap-2">
                        {habits.map((h) => (
                            <button
                                key={h.id}
                                type="button"
                                onClick={() => void logHabit(h.id, day)}
                                style={{ backgroundColor: tint(h.color, 0.14), borderColor: tint(h.color, 0.4) }}
                                className="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium text-primary"
                            >
                                <span>{h.emoji || "•"}</span>
                                {h.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </Sheet>
    );
}
