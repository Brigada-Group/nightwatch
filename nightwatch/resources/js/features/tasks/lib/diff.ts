export type DiffLineType = 'equal' | 'add' | 'remove';

export type DiffLine = {
    type: DiffLineType;
    content: string;
    /** 1-based line number in the old file (null on add). */
    oldLine: number | null;
    /** 1-based line number in the new file (null on remove). */
    newLine: number | null;
};

/**
 * Line-level diff via classic LCS. Splits both texts on '\n' and walks the
 * LCS table to emit a flat unified-diff sequence. The byte budget for a file
 * is capped server-side so the table dimensions stay tractable for an
 * interactive review modal.
 */
export function diffLines(oldText: string, newText: string): DiffLine[] {
    // Empty-side shortcuts: when one side is empty (e.g. a brand-new file
    // proposed by the AI), splitting on '\n' would yield [''] and produce a
    // misleading single-line "removed blank line" entry. Render the present
    // side as a flat list of adds/removes instead.
    if (oldText === '' && newText === '') {
        return [];
    }
    if (oldText === '') {
        return newText.split('\n').map((line, i) => ({
            type: 'add' as const,
            content: line,
            oldLine: null,
            newLine: i + 1,
        }));
    }
    if (newText === '') {
        return oldText.split('\n').map((line, i) => ({
            type: 'remove' as const,
            content: line,
            oldLine: i + 1,
            newLine: null,
        }));
    }

    const a = oldText.split('\n');
    const b = newText.split('\n');
    const m = a.length;
    const n = b.length;

    const lcs: number[][] = Array.from({ length: m + 1 }, () =>
        new Array<number>(n + 1).fill(0),
    );

    for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
            if (a[i] === b[j]) {
                lcs[i][j] = lcs[i + 1][j + 1] + 1;
            } else {
                lcs[i][j] = Math.max(lcs[i + 1][j], lcs[i][j + 1]);
            }
        }
    }

    const out: DiffLine[] = [];
    let i = 0;
    let j = 0;

    while (i < m && j < n) {
        if (a[i] === b[j]) {
            out.push({
                type: 'equal',
                content: a[i],
                oldLine: i + 1,
                newLine: j + 1,
            });
            i++;
            j++;
        } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
            out.push({
                type: 'remove',
                content: a[i],
                oldLine: i + 1,
                newLine: null,
            });
            i++;
        } else {
            out.push({
                type: 'add',
                content: b[j],
                oldLine: null,
                newLine: j + 1,
            });
            j++;
        }
    }

    while (i < m) {
        out.push({
            type: 'remove',
            content: a[i],
            oldLine: i + 1,
            newLine: null,
        });
        i++;
    }

    while (j < n) {
        out.push({
            type: 'add',
            content: b[j],
            oldLine: null,
            newLine: j + 1,
        });
        j++;
    }

    return out;
}

export function countDiffStats(lines: DiffLine[]): { added: number; removed: number } {
    let added = 0;
    let removed = 0;

    for (const line of lines) {
        if (line.type === 'add') added++;
        else if (line.type === 'remove') removed++;
    }

    return { added, removed };
}
