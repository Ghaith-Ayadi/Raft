import { type ReactNode, createContext, useCallback, useContext, useRef, useState } from "react";

export interface Toast {
    id: number;
    message: string;
    action?: { label: string; onAction: () => void };
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, action?: Toast["action"]) => void;
    dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextType>({
    toasts: [],
    addToast: () => {},
    dismiss: () => {},
});

export function useToast() {
    return useContext(ToastContext);
}

// One toast at a time: rapid taps replace each other instead of stacking.
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextId = useRef(0);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (message: string, action?: Toast["action"]) => {
            const id = nextId.current++;
            setToasts([{ id, message, action }]);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => dismiss(id), action ? 3500 : 2000);
        },
        [dismiss],
    );

    return <ToastContext.Provider value={{ toasts, addToast, dismiss }}>{children}</ToastContext.Provider>;
}
