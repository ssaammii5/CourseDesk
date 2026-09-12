const HEADER_COLORS = ["#546e7a", "#0277bd", "#3f51b5", "#188038", "#b06000", "#7b1fa2", "#c5221f", "#00838f"];
const EMOJIS = ["📘", "📕", "📗", "📙", "📐", "🔐", "🧮", "⚗️"];
const AVATAR_CLASSES = [
    "bg-[#57a05a]",
    "bg-[#1e8e3e]",
    "bg-amber-800",
    "bg-sky-800",
    "bg-purple-800",
    "bg-rose-700",
];

export function headerColorFor(id: number): string {
    return HEADER_COLORS[Math.abs(id) % HEADER_COLORS.length];
}

export function emojiFor(id: number): string {
    return EMOJIS[Math.abs(id) % EMOJIS.length];
}

export function avatarClassFor(id: number): string {
    return AVATAR_CLASSES[Math.abs(id) % AVATAR_CLASSES.length];
}

export function letterOf(name: string): string {
    return name.trim().charAt(0).toUpperCase() || "?";
}
