import { useState } from "react";
import { MessageTextSquare01, Trash01 } from "@untitledui/icons";
import { CommentSheet } from "@/components/app/comment-sheet";
import { Sheet } from "@/components/app/sheet";
import { StateSheet } from "@/components/app/state-sheet";
import { useHabits, useLogs } from "@/hooks/use-timber";
import { deleteLog, logHabit, restoreLog } from "@/lib/actions";
import { dayLabel, timeLabel } from "@/lib/days";
import { tint } from "@/lib/palette";
import { pickedLabels } from "@/lib/states";
import { useToast } from "@/providers/toast-provider";
import type { Habit } from "@/types/timber";
import { cx } from "@/utils/cx";

interface DaySheetProps {
    day: string | null;
    onClose: () => void;
}

/** One day's logs, with comments, removal and back-filling. */
export function DaySheet({ day, onClose }: DaySheetProps) {
    const habits = useHabits();
    const logs = useLogs(day ?? "", day ?? "");
    const habitById = new Map(habits.map((h) => [h.id, h]));
    const visible = logs.filter((l) => habitById.has(l.habitId));
    const { addToast } = useToast();
    const [stateFor, setStateFor] = useState<Habit | null>(null);
    const [commentFor, setCommentFor] = useState<{ logId: string; comment: string; title: string } | null>(null);

    const backfill = (h: Habit) => {
        if (!day) return;
        if (h.kind === "state") setStateFor(h);
        else void logHabit(h.id, day);
    };

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
                        const picked = pickedLabels(h, l);
                        return (
                            <li key={l.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-primary_hover">
                                <span
                                    style={{ backgroundColor: tint(h.color, 0.18) }}
                                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-lg"
                                >
                                    {h.emoji || "•"}
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="text-sm font-medium break-words text-primary">
                                        {h.title}
                                        {picked.length > 0 && <span className="text-tertiary">: {picked.join(", ")}</span>}
                                    </span>
                                    {l.comment && <span className="text-xs break-words whitespace-pre-line text-tertiary">{l.comment}</span>}
                                </span>
                                <span className="shrink-0 text-xs text-quaternary">{timeLabel(l.loggedAt)}</span>
                                <button
                                    type="button"
                                    aria-label={l.comment ? `Edit comment on ${h.title}` : `Comment on ${h.title}`}
                                    onClick={() => setCommentFor({ logId: l.id, comment: l.comment, title: `Comment on ${`${h.emoji} ${h.title}`.trim()}` })}
                                    className={cx(
                                        "cursor-pointer rounded-lg p-1.5 hover:bg-primary_hover hover:text-fg-quaternary_hover",
                                        l.comment ? "text-fg-brand-secondary" : "text-fg-quaternary",
                                    )}
                                >
                                    <MessageTextSquare01 className="size-4" />
                                </button>
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
                                onClick={() => backfill(h)}
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

            <StateSheet
                habit={stateFor}
                onClose={() => setStateFor(null)}
                onLog={(values) => {
                    if (stateFor && day) void logHabit(stateFor.id, day, values);
                    setStateFor(null);
                }}
            />
            <CommentSheet target={commentFor} onClose={() => setCommentFor(null)} />
        </Sheet>
    );
}
