import { type MouseEvent, type PointerEvent, useEffect, useRef } from "react";

const DELAY = 450;
/** A finger that drifts further than this is scrolling, not pressing. */
const SLOP = 10;

/**
 * Tap calls `onPress`, holding calls `onLongPress` instead (and so does a
 * right-click). Spread the result onto the element.
 */
export function useLongPress(onPress: () => void, onLongPress: () => void) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const start = useRef<{ x: number; y: number } | null>(null);
    const fired = useRef(false);
    const isHolding = useRef(false);

    const clear = () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        start.current = null;
    };

    useEffect(() => clear, []);

    const fire = () => {
        clear();
        if (fired.current) return;
        fired.current = true;
        navigator.vibrate?.(15);
        onLongPress();
    };

    return {
        onPointerDown: (e: PointerEvent) => {
            if (e.button !== 0) return;
            fired.current = false;
            isHolding.current = true;
            start.current = { x: e.clientX, y: e.clientY };
            timer.current = setTimeout(fire, DELAY);
        },
        onPointerMove: (e: PointerEvent) => {
            if (start.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > SLOP) clear();
        },
        onPointerUp: () => {
            isHolding.current = false;
            clear();
        },
        onPointerCancel: () => {
            isHolding.current = false;
            clear();
        },
        onPointerLeave: clear,
        onClick: () => {
            // The click that ends a long press is not a tap.
            if (fired.current) {
                fired.current = false;
                return;
            }
            onPress();
        },
        onContextMenu: (e: MouseEvent) => {
            e.preventDefault();
            // Touch browsers send this during a hold, which `fired` dedupes; a right-click is a fresh press.
            if (!isHolding.current) fired.current = false;
            fire();
        },
    };
}
