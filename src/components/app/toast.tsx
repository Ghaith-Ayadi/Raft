import { AnimatePresence, motion } from "motion/react";
import { useToast } from "@/providers/toast-provider";

export function ToastContainer() {
    const { toasts, dismiss } = useToast();

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-[100] flex justify-center px-4 sm:bottom-8">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="pointer-events-auto flex items-center gap-4 rounded-xl bg-primary-solid py-2.5 pr-2.5 pl-4 text-sm font-medium text-white shadow-lg"
                    >
                        <span className="min-w-0 truncate">{toast.message}</span>
                        {toast.actions.length > 0 && (
                            <span className="flex shrink-0 gap-1">
                                {toast.actions.map((action) => (
                                    <button
                                        key={action.label}
                                        type="button"
                                        className="cursor-pointer rounded-lg px-2 py-1 font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                                        onClick={() => {
                                            action.onAction();
                                            dismiss(toast.id);
                                        }}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </span>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
