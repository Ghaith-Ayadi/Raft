import { useState } from "react";
import { MessageTextSquare01, Trash01 } from "@untitledui/icons";
import { CommentSheet } from "@/components/app/comment-sheet";
import { deleteLog, restoreLog, setLogTime } from "@/lib/actions";
import { timeValue } from "@/lib/days";
import { tint } from "@/lib/palette";
import { pickedLabels } from "@/lib/states";
import { useToast } from "@/providers/toast-provider";
import type { Habit, Log } from "@/types/raft";
import { cx } from "@/utils/cx";

interface LogListProps {
    logs: Log[];
    habitById: Map<string, Habit>;
}

/** One day's logs: tap the time to change it, comment, or remove. Logs of deleted habits are skipped. */
export function LogList({ logs, habitById }: LogListProps) {
    const { addToast } = useToast();
    const [commentFor, setCommentFor] = useState<{ logId: string; comment: string; title: string } | null>(null);

    const remove = async (id: string) => {
        await deleteLog(id);
        addToast("Log removed", { label: "Undo", onAction: () => void restoreLog(id) });
    };

    return (
        <>
            <ul className="flex flex-col gap-1">
                {logs.map((l) => {
                    const h = habitById.get(l.habitId);
                    if (!h) return null;
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
                            <input
                                type="time"
                                aria-label={`Time of ${h.title}`}
                                value={timeValue(l.loggedAt)}
                                onChange={(e) => e.target.value && void setLogTime(l.id, e.target.value)}
                                className="shrink-0 cursor-pointer rounded-lg bg-transparent px-1.5 py-1 text-xs text-tertiary tabular-nums outline-focus-ring hover:bg-primary_hover focus-visible:outline-2 [&::-webkit-calendar-picker-indicator]:hidden"
                            />
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
            <CommentSheet target={commentFor} onClose={() => setCommentFor(null)} />
        </>
    );
}
