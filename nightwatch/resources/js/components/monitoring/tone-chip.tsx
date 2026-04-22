import { cn } from '@/lib/utils';

export type ToneChipKind =
    | 'severity'
    | 'logLevel'
    | 'jobStatus'
    | 'httpStatus'
    | 'httpMethod'
    | 'health'
    | 'delivery'
    | 'taskStatus'
    | 'exitCode'
    | 'projectStatus';

/**
 * Each tone pairs a light-mode style (solid pastel) with a dark-mode gradient.
 * Using `dark:` prefixes keeps the existing rich dark look while giving light
 * mode legible, high-contrast chips against white surfaces.
 */

const TONE = {
    rose: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/25 dark:bg-gradient-to-br dark:from-rose-500/20 dark:to-rose-950/30 dark:text-rose-100 dark:ring-1 dark:ring-rose-400/15',
    red: 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-gradient-to-br dark:from-red-500/18 dark:to-red-950/25 dark:text-red-100 dark:ring-1 dark:ring-red-400/12',
    orange: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/22 dark:bg-gradient-to-br dark:from-orange-500/18 dark:to-orange-950/25 dark:text-orange-100 dark:ring-1 dark:ring-orange-400/10',
    amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-gradient-to-br dark:from-amber-500/16 dark:to-amber-950/22 dark:text-amber-100 dark:ring-1 dark:ring-amber-400/10',
    emerald:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/22 dark:bg-gradient-to-br dark:from-emerald-500/16 dark:to-emerald-950/25 dark:text-emerald-100 dark:ring-1 dark:ring-emerald-400/10',
    sky: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-gradient-to-br dark:from-sky-500/15 dark:to-sky-950/25 dark:text-sky-100 dark:ring-1 dark:ring-sky-400/10',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/20 dark:bg-gradient-to-br dark:from-cyan-500/14 dark:to-cyan-950/30 dark:text-cyan-100 dark:ring-1 dark:ring-cyan-400/10',
    teal: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-400/22 dark:bg-gradient-to-br dark:from-teal-500/14 dark:to-teal-950/25 dark:text-teal-100 dark:ring-1 dark:ring-teal-400/10',
    violet: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/22 dark:bg-gradient-to-br dark:from-violet-500/16 dark:to-violet-950/30 dark:text-violet-100 dark:ring-1 dark:ring-violet-400/10',
    fuchsia:
        'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-400/30 dark:bg-gradient-to-br dark:from-fuchsia-600/25 dark:to-purple-950/35 dark:text-fuchsia-100 dark:ring-1 dark:ring-fuchsia-400/15',
    slate: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/25 dark:bg-gradient-to-br dark:from-slate-500/12 dark:to-slate-900/35 dark:text-slate-200 dark:ring-1 dark:ring-slate-400/10',
    zinc: 'border-border bg-muted text-muted-foreground dark:border-zinc-500/25 dark:bg-gradient-to-br dark:from-zinc-500/12 dark:to-zinc-900/40 dark:text-zinc-200 dark:ring-1 dark:ring-zinc-400/10',
} as const;

const SEVERITY: Record<string, string> = {
    critical: TONE.rose,
    error: TONE.red,
    warning: TONE.amber,
    info: TONE.sky,
    debug: TONE.zinc,
};

const LOG_LEVEL: Record<string, string> = {
    emergency: TONE.fuchsia,
    alert: TONE.rose,
    critical: TONE.red,
    error: TONE.orange,
    warning: TONE.amber,
    notice: TONE.teal,
    info: TONE.cyan,
    debug: TONE.slate,
};

const JOB_STATUS: Record<string, string> = {
    completed: TONE.emerald,
    failed: TONE.rose,
    processing: TONE.violet,
    pending: TONE.zinc,
};

const HEALTH: Record<string, string> = {
    ok: TONE.emerald,
    warning: TONE.amber,
    critical: TONE.rose,
    error: TONE.red,
};

const DELIVERY: Record<string, string> = {
    sent: TONE.emerald,
    failed: TONE.rose,
};

const TASK_STATUS: Record<string, string> = {
    completed: TONE.emerald,
    failed: TONE.rose,
    skipped: TONE.slate,
};

const PROJECT_STATUS: Record<string, string> = {
    normal: TONE.emerald,
    warning: TONE.amber,
    critical: TONE.rose,
};

const METHOD: Record<string, string> = {
    GET: TONE.sky,
    POST: TONE.violet,
    PUT: TONE.amber,
    PATCH: TONE.orange,
    DELETE: TONE.rose,
    HEAD: TONE.zinc,
    OPTIONS: TONE.teal,
};

const NEUTRAL = TONE.zinc;

function pick(
    map: Record<string, string>,
    key: string,
    fallback: string,
): string {
    return map[key] ?? fallback;
}

function httpStatusClass(code: number): string {
    switch (true) {
        case code >= 500:
            return TONE.rose;
        case code >= 400:
            return TONE.orange;
        case code >= 300:
            return TONE.amber;
        default:
            return TONE.emerald;
    }
}

function exitCodeClass(code: number): string {
    return code === 0 ? TONE.emerald : TONE.rose;
}

function resolveTone(
    kind: ToneChipKind,
    value: string | number | null | undefined,
    key: string,
): string {
    switch (kind) {
        case 'severity':
            return pick(SEVERITY, key, NEUTRAL);
        case 'logLevel':
            return pick(LOG_LEVEL, key, NEUTRAL);
        case 'jobStatus':
            return pick(JOB_STATUS, key, NEUTRAL);
        case 'health':
            return pick(HEALTH, key, NEUTRAL);
        case 'delivery':
            return pick(DELIVERY, key, NEUTRAL);
        case 'taskStatus':
            return pick(TASK_STATUS, key, NEUTRAL);
        case 'projectStatus':
            return pick(PROJECT_STATUS, key, NEUTRAL);
        case 'httpMethod':
            return pick(METHOD, key.toUpperCase(), NEUTRAL);
        case 'httpStatus': {
            const n = typeof value === 'number' ? value : Number(value);

            return Number.isFinite(n) ? httpStatusClass(n) : NEUTRAL;
        }
        case 'exitCode': {
            if (value === null || value === undefined || value === '') {
                return NEUTRAL;
            }

            const code = Number(value);

            return Number.isFinite(code) ? exitCodeClass(code) : NEUTRAL;
        }
        default:
            return NEUTRAL;
    }
}

function formatLabel(
    kind: ToneChipKind,
    raw: string | number | null | undefined,
): string {
    switch (kind) {
        case 'httpStatus':
            return raw === null || raw === undefined ? '—' : String(raw);
        case 'exitCode':
            if (raw === null || raw === undefined || raw === '') {
                return '—';
            }

            return String(raw);
        case 'httpMethod': {
            const s = String(raw ?? '');

            return s ? s.toUpperCase() : '—';
        }
        default: {
            const s = String(raw ?? '');

            return s
                ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
                : '—';
        }
    }
}

type Props = {
    kind: ToneChipKind;
    value: string | number | null | undefined;
    /** When set, shown instead of the auto-derived label. */
    label?: string;
    className?: string;
};

export function ToneChip({ kind, value, label, className }: Props) {
    const key =
        typeof value === 'number'
            ? String(value)
            : (value ?? '').toString().toLowerCase();

    const tone = resolveTone(kind, value, key);

    return (
        <span
            className={cn(
                'inline-flex min-h-[1.5rem] items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide dark:backdrop-blur-sm',
                tone,
                className,
            )}
        >
            {label ?? formatLabel(kind, value)}
        </span>
    );
}
