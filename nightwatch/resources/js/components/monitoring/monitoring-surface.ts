// Light: clean white card with standard border.
// Dark: preserved exactly as before — subtle white/[0.08] border + zinc-950 glass gradient.
export const monitoringCardClass =
    'overflow-hidden border bg-card border-border shadow-sm dark:border-white/[0.08] dark:bg-gradient-to-br dark:from-zinc-950/95 dark:via-zinc-950/80 dark:to-black/70 dark:shadow-[0_24px_64px_-28px_rgba(0,0,0,0.85)] dark:backdrop-blur-md';

export const monitoringTableHeaderClass =
    '[&_tr]:border-border [&_tr]:bg-muted/30 dark:[&_tr]:border-white/[0.06] dark:[&_tr]:bg-gradient-to-r dark:[&_tr]:from-violet-500/[0.07] dark:[&_tr]:via-white/[0.02] dark:[&_tr]:to-cyan-500/[0.06]';

export const monitoringTableHeadClass =
    'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

export const monitoringTableRowClass =
    'border-border/60 hover:bg-accent/50 dark:border-white/[0.04] dark:hover:bg-gradient-to-r dark:hover:from-violet-500/[0.05] dark:hover:via-transparent dark:hover:to-cyan-500/[0.04]';
