export function initialOf(name: string | null | undefined, fallback = "?"): string {
    const trimmed = name?.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : fallback;
}
