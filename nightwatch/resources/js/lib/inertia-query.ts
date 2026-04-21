export function pathWithQuery(
    path: string,
    params: Record<string, string | number | boolean | null | undefined>,
): string {
    const usp = new URLSearchParams();
    for (const [key, raw] of Object.entries(params)) {
        if (raw === null || raw === undefined || raw === '') {
            continue;
        }
        if (raw === false) {
            continue;
        }
        usp.set(key, String(raw));
    }
    const q = usp.toString();
    return q ? `${path}?${q}` : path;
}
