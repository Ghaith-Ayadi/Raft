// The on-screen keyboard. Phones shrink the visual viewport when it opens but
// leave fixed elements sized to the layout viewport, so a bottom sheet ends up
// behind the keyboard. Mirror the visual viewport into CSS variables that the
// sheet overlay sizes itself with, and flag the keyboard on <html>.

/** Height lost to the keyboard before we call it open (browser bars move by less). */
const KEYBOARD_MIN = 120;

export function trackVisualViewport() {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => {
        root.style.setProperty("--vv-top", `${vv.offsetTop}px`);
        root.style.setProperty("--vv-height", `${vv.height}px`);
        const isOpen = window.innerHeight - vv.height > KEYBOARD_MIN;
        if (isOpen) {
            root.dataset.keyboard = "open";
            // Keep the focused field in sight once the sheet has shrunk around it.
            requestAnimationFrame(() => (document.activeElement as HTMLElement | null)?.scrollIntoView?.({ block: "nearest" }));
        } else delete root.dataset.keyboard;
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
}
