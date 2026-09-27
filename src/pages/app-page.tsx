import { useState } from "react";
import { Calendar, Check, Edit05, Grid01 } from "@untitledui/icons";
import { AccountButton } from "@/components/app/account-button";
import { HabitEditor } from "@/components/app/habit-editor";
import { HabitPicker } from "@/components/app/habit-picker";
import { MonthCalendar } from "@/components/app/month-calendar";
import { ToastContainer } from "@/components/app/toast";
import type { Habit } from "@/types/shame";
import { cx } from "@/utils/cx";

type Tab = "log" | "calendar";

const TABS: { id: Tab; label: string; icon: typeof Grid01 }[] = [
    { id: "log", label: "Log", icon: Grid01 },
    { id: "calendar", label: "Calendar", icon: Calendar },
];

export function AppPage() {
    const [tab, setTab] = useState<Tab>("log");
    const [isEditing, setIsEditing] = useState(false);
    const [editor, setEditor] = useState<{ habit: Habit | null } | null>(null);

    return (
        <div className="flex min-h-dvh flex-col bg-primary">
            <header className="sticky top-0 z-30 border-b border-secondary bg-primary/90 pt-[env(safe-area-inset-top)] backdrop-blur">
                <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
                    <h1 className="text-lg font-semibold text-primary">Shame</h1>

                    <nav className="ml-4 hidden gap-1 sm:flex">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id)}
                                className={cx(
                                    "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold",
                                    tab === t.id ? "bg-secondary text-primary" : "text-quaternary hover:text-tertiary",
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </nav>

                    <div className="ml-auto flex items-center gap-1">
                        {tab === "log" && (
                            <button
                                type="button"
                                onClick={() => setIsEditing((e) => !e)}
                                className={cx(
                                    "flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold",
                                    isEditing ? "bg-brand-solid text-white" : "text-tertiary hover:bg-primary_hover",
                                )}
                            >
                                {isEditing ? <Check className="size-4" /> : <Edit05 className="size-4" />}
                                {isEditing ? "Done" : "Edit"}
                            </button>
                        )}
                        <AccountButton />
                    </div>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col pb-[calc(env(safe-area-inset-bottom)+4.5rem)] sm:pb-8">
                {tab === "log" ? <HabitPicker isEditing={isEditing} onEdit={(habit) => setEditor({ habit })} /> : <MonthCalendar />}
            </main>

            <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-secondary bg-primary pb-[env(safe-area-inset-bottom)] sm:hidden">
                <div className="flex">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id)}
                            className={cx(
                                "flex flex-1 cursor-pointer flex-col items-center gap-0.5 pt-2.5 pb-2 text-xs font-semibold",
                                tab === t.id ? "text-brand-secondary" : "text-quaternary",
                            )}
                        >
                            <t.icon className="size-6" />
                            {t.label}
                        </button>
                    ))}
                </div>
            </nav>

            <HabitEditor isOpen={editor !== null} habit={editor?.habit ?? null} onClose={() => setEditor(null)} />
            <ToastContainer />
        </div>
    );
}
