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

const SEVERITY: Record<string, string> = {
    critical:
        'border-rose-400/25 bg-gradient-to-br from-rose-500/20 to-rose-950/30 text-rose-100 ring-1 ring-rose-400/15',
    error:
        'border-red-400/20 bg-gradient-to-br from-red-500/18 to-red-950/25 text-red-100 ring-1 ring-red-400/12',
    warning:
        'border-amber-400/25 bg-gradient-to-br from-amber-500/16 to-amber-950/20 text-amber-100 ring-1 ring-amber-400/12',
    info: 'border-sky-400/20 bg-gradient-to-br from-sky-500/15 to-sky-950/25 text-sky-100 ring-1 ring-sky-400/10',
    debug:
        'border-zinc-500/25 bg-gradient-to-br from-zinc-500/12 to-zinc-900/40 text-zinc-200 ring-1 ring-zinc-400/10',
};

const LOG_LEVEL: Record<string, string> = {
    emergency:
        'border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-600/25 to-purple-950/35 text-fuchsia-100 ring-1 ring-fuchsia-400/15',
    alert:
        'border-rose-400/28 bg-gradient-to-br from-rose-600/22 to-rose-950/30 text-rose-100 ring-1 ring-rose-400/12',
    critical:
        'border-red-400/28 bg-gradient-to-br from-red-600/22 to-red-950/30 text-red-100 ring-1 ring-red-400/12',
    error:
        'border-orange-400/22 bg-gradient-to-br from-orange-500/18 to-orange-950/25 text-orange-100 ring-1 ring-orange-400/10',
    warning:
        'border-amber-400/25 bg-gradient-to-br from-amber-500/16 to-amber-950/22 text-amber-100 ring-1 ring-amber-400/10',
    notice:
        'border-teal-400/22 bg-gradient-to-br from-teal-500/14 to-teal-950/25 text-teal-100 ring-1 ring-teal-400/10',
    info: 'border-cyan-400/20 bg-gradient-to-br from-cyan-500/14 to-cyan-950/30 text-cyan-100 ring-1 ring-cyan-400/10',
    debug:
        'border-slate-500/25 bg-gradient-to-br from-slate-500/12 to-slate-900/35 text-slate-200 ring-1 ring-slate-400/10',
};

const JOB_STATUS: Record<string, string> = {
    completed:
        'border-emerald-400/22 bg-gradient-to-br from-emerald-500/16 to-emerald-950/25 text-emerald-100 ring-1 ring-emerald-400/10',
    failed:
        'border-rose-400/25 bg-gradient-to-br from-rose-500/18 to-rose-950/30 text-rose-100 ring-1 ring-rose-400/12',
    processing:
        'border-violet-400/22 bg-gradient-to-br from-violet-500/16 to-violet-950/30 text-violet-100 ring-1 ring-violet-400/10',
    pending:
        'border-zinc-500/22 bg-gradient-to-br from-zinc-500/12 to-zinc-900/35 text-zinc-200 ring-1 ring-zinc-400/10',
};

const HEALTH: Record<string, string> = {
    ok: 'border-emerald-400/22 bg-gradient-to-br from-emerald-500/14 to-emerald-950/25 text-emerald-100 ring-1 ring-emerald-400/10',
    warning:
        'border-amber-400/25 bg-gradient-to-br from-amber-500/16 to-amber-950/22 text-amber-100 ring-1 ring-amber-400/10',
    critical:
        'border-rose-400/28 bg-gradient-to-br from-rose-600/22 to-rose-950/30 text-rose-100 ring-1 ring-rose-400/12',
    error:
        'border-red-400/25 bg-gradient-to-br from-red-500/18 to-red-950/28 text-red-100 ring-1 ring-red-400/12',
};

const DELIVERY: Record<string, string> = {
    sent: 'border-emerald-400/22 bg-gradient-to-br from-emerald-500/14 to-emerald-950/25 text-emerald-100 ring-1 ring-emerald-400/10',
    failed:
        'border-rose-400/25 bg-gradient-to-br from-rose-500/18 to-rose-950/30 text-rose-100 ring-1 ring-rose-400/12',
};

const TASK_STATUS: Record<string, string> = {
    completed: JOB_STATUS.completed,
    failed: JOB_STATUS.failed,
    skipped:
        'border-slate-400/22 bg-gradient-to-br from-slate-500/12 to-slate-900/35 text-slate-200 ring-1 ring-slate-400/10',
};

const PROJECT_STATUS: Record<string, string> = {
    normal:
        'border-emerald-400/20 bg-gradient-to-br from-emerald-500/12 to-emerald-950/22 text-emerald-100 ring-1 ring-emerald-400/10',
    warning: SEVERITY.warning,
    critical: SEVERITY.critical,
};

const METHOD: Record<string, string> = {
    GET: 'border-sky-400/20 bg-gradient-to-br from-sky-500/14 to-sky-950/30 text-sky-100 ring-1 ring-sky-400/10',
    POST: 'border-violet-400/22 bg-gradient-to-br from-violet-500/14 to-violet-950/30 text-violet-100 ring-1 ring-violet-400/10',
    PUT: 'border-amber-400/22 bg-gradient-to-br from-amber-500/14 to-amber-950/25 text-amber-100 ring-1 ring-amber-400/10',
    PATCH:
        'border-orange-400/20 bg-gradient-to-br from-orange-500/12 to-orange-950/25 text-orange-100 ring-1 ring-orange-400/10',
    DELETE:
        'border-rose-400/22 bg-gradient-to-br from-rose-500/14 to-rose-950/28 text-rose-100 ring-1 ring-rose-400/10',
    HEAD: 'border-zinc-500/22 bg-gradient-to-br from-zinc-500/12 to-zinc-900/35 text-zinc-200 ring-1 ring-zinc-400/10',
    OPTIONS:
        'border-teal-400/20 bg-gradient-to-br from-teal-500/12 to-teal-950/28 text-teal-100 ring-1 ring-teal-400/10',
};

const NEUTRAL =
    'border-white/10 bg-white/[0.06] text-zinc-200 ring-1 ring-white/5';

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
            return 'border-rose-400/25 bg-gradient-to-br from-rose-500/18 to-rose-950/30 text-rose-100 ring-1 ring-rose-400/12';
        case code >= 400:
            return 'border-orange-400/22 bg-gradient-to-br from-orange-500/16 to-orange-950/25 text-orange-100 ring-1 ring-orange-400/10';
        case code >= 300:
            return 'border-amber-400/20 bg-gradient-to-br from-amber-500/12 to-amber-950/22 text-amber-100 ring-1 ring-amber-400/10';
        default:
            return 'border-emerald-400/20 bg-gradient-to-br from-emerald-500/14 to-emerald-950/25 text-emerald-100 ring-1 ring-emerald-400/10';
    }
}

function exitCodeClass(code: number): string {
    if (code === 0) {
        return 'border-emerald-400/20 bg-gradient-to-br from-emerald-500/12 to-emerald-950/22 text-emerald-100 ring-1 ring-emerald-400/10';
    }
    return 'border-rose-400/22 bg-gradient-to-br from-rose-500/14 to-rose-950/28 text-rose-100 ring-1 ring-rose-400/10';
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
                'inline-flex min-h-[1.5rem] items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide backdrop-blur-sm',
                tone,
                className,
            )}
        >
            {label ?? formatLabel(kind, value)}
        </span>
    );
}
