export const SEVERITY_ORDER: Record<string, number> = {
    critical: 0,
    high: 1,
    moderate: 2,
    low: 3,
    info: 4,
};

export function severityRank(severity: string | null | undefined): number {
    if (!severity) {
        return 99;
    }

    return SEVERITY_ORDER[severity.toLowerCase()] ?? 99;
}

export function sortBySeverity<T extends { severity?: string | null }>(
    items: T[],
): T[] {
    return [...items].sort(
        (a, b) => severityRank(a.severity) - severityRank(b.severity),
    );
}

export type SeverityTone = 'critical' | 'warning' | 'info' | 'debug';

export function severityToTone(severity: string): SeverityTone {
    switch (severity.toLowerCase()) {
        case 'critical':
            return 'critical';
        case 'high':
        case 'moderate':
            return 'warning';
        case 'low':
        case 'info':
            return 'info';
        default:
            return 'debug';
    }
}

export function capitalize(value: string): string {
    if (!value) {
        return '';
    }

    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
