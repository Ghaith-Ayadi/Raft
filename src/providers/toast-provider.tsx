import { type ReactNode, createContext, useCallback, useContext, useRef, useState } from "react";

export interface ToastAction {
    label: string;
    onAction: () => void;
}

export interface Toast {
    id: number;
    message: string;
    actions: ToastAction[];
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, actions?: ToastAction | ToastAction[]) => void;
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
        (message: string, actions?: ToastAction | ToastAction[]) => {
            const id = nextId.current++;
            const list = actions ? [actions].flat() : [];
            setToasts([{ id, message, actions: list }]);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => dismiss(id), list.length ? 1500 + 2000 * list.length : 2000);
        },
        [dismiss],
    );

    return <ToastContext.Provider value={{ toasts, addToast, dismiss }}>{children}</ToastContext.Provider>;
}
