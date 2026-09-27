// Choices offered in the habit editor. Any emoji can be typed; these are shortcuts.

export const COLORS = ["#F04438", "#F79009", "#EAAA08", "#66C61C", "#12B76A", "#06AED4", "#2E90FA", "#6172F3", "#7A5AF8", "#EE46BC", "#667085"];

export const EMOJIS = ["💧", "🏃", "🧘", "📚", "🥗", "💪", "😴", "🚭", "🍷", "☕️", "🦷", "💊", "🧹", "✍️", "🎸", "🌱", "📵", "🚶", "🍫", "🙏"];

/** `color` with an alpha channel, for tinted backgrounds. */
export function tint(color: string, alpha: number): string {
    const a = Math.round(alpha * 255)
        .toString(16)
        .padStart(2, "0");
    return /^#[0-9a-f]{6}$/i.test(color) ? `${color}${a}` : color;
}
