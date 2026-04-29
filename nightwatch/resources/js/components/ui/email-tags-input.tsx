import { X } from 'lucide-react';
import {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@\u0000]+\.[^\s@]+$/u;

function normalizeKey(email: string): string {
    return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
    const t = email.trim();
    return t !== '' && EMAIL_RE.test(t);
}

function splitPieces(text: string): string[] {
    return text.split(/[,;\s\n]+/).map((x) => x.trim()).filter(Boolean);
}

function mergeUnique(current: string[], additions: string[]): string[] {
    const keys = new Set(current.map(normalizeKey));
    const next = [...current];

    for (const raw of additions) {
        if (!isValidEmail(raw)) {
            continue;
        }

        const k = normalizeKey(raw);
        if (keys.has(k)) {
            continue;
        }

        keys.add(k);
        next.push(raw.trim());
    }

    return next;
}

export type EmailTagsInputHandle = {
    flushPendingInput: () => void;
};

export type EmailTagsInputProps = {
    id?: string;
    value: string[];
    onChange: (next: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

export const EmailTagsInput = forwardRef<
    EmailTagsInputHandle,
    EmailTagsInputProps
>(function EmailTagsInput(
    {
        id,
        value,
        onChange,
        placeholder = 'name@company.com',
        disabled = false,
        className,
    },
    ref,
) {
    const [draft, setDraft] = useState('');
    const composing = useRef(false);

    function flushPendingInput(): void {
        const trimmed = draft.trim();
        if (trimmed === '') {
            return;
        }

        const rawParts = splitPieces(trimmed);
        const segments =
            rawParts.length >= 2 ? rawParts : [trimmed];

        const validAdds = segments.filter(isValidEmail);
        if (validAdds.length === 0) {
            return;
        }

        onChange(mergeUnique(value, validAdds));
        setDraft('');
    }

    useImperativeHandle(ref, () => ({ flushPendingInput }));

    function removeEmail(keyToRemove: string) {
        onChange(
            value.filter(
                (item) => normalizeKey(item) !== keyToRemove,
            ),
        );
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (composing.current) {
            return;
        }

        if (
            e.key === 'Enter' ||
            e.key === ',' ||
            e.key === ';' ||
            e.key === ' '
        ) {
            e.preventDefault();
            flushPendingInput();

            return;
        }

        if (e.key === 'Backspace' && draft === '' && value.length > 0) {
            onChange(value.slice(0, -1));

            return;
        }
    }

    function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
        const text = e.clipboardData.getData('text').trim();

        const parts = splitPieces(text);
        if (parts.filter(isValidEmail).length <= 1) {
            return;
        }

        e.preventDefault();

        const next = mergeUnique(
            value,
            parts.filter(isValidEmail),
        );
        onChange(next);
        setDraft('');
    }

    return (
        <div
            className={cn(
                'bg-background shadow-xs flex min-h-10 flex-wrap gap-1.5 rounded-md border px-3 py-2 transition-colors',
                'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
                disabled &&
                    'cursor-not-allowed opacity-50',
                className,
            )}
        >
            {value.map((email, index) => {
                const rk = normalizeKey(email) || `tag-${index}`;

                return (
                    <Badge
                        key={`${rk}-${index}`}
                        variant="secondary"
                        className="flex h-7 shrink-0 max-w-[min(100%,14rem)] items-center gap-1 px-2 py-0 text-xs font-normal"
                    >
                        <span className="min-w-0 flex-1 truncate">{email}</span>
                        {!disabled ? (
                            <button
                                type="button"
                                aria-label={`Remove ${email}`}
                                className="text-muted-foreground hover:text-destructive -mr-0.5 inline-flex shrink-0 rounded-sm outline-none disabled:pointer-events-none"
                                disabled={disabled}
                                onMouseDown={(ev) => ev.preventDefault()}
                                onClick={() => removeEmail(normalizeKey(email))}
                            >
                                <X className="size-3.5" />
                            </button>
                        ) : null}
                    </Badge>
                );
            })}

            <input
                id={id}
                disabled={disabled}
                type="text"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder={value.length === 0 ? placeholder : ''}
                value={draft}
                className={cn(
                    'placeholder:text-muted-foreground min-h-6 min-w-[10rem] flex-1 border-0 bg-transparent text-sm outline-none disabled:opacity-70',
                    value.length > 0 && draft === '' ? 'min-w-[4rem]' : '',
                )}
                onChange={(e) => setDraft(e.target.value)}
                onCompositionStart={() => {
                    composing.current = true;
                }}
                onCompositionEnd={() => {
                    composing.current = false;
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={() => flushPendingInput()}
            />
        </div>
    );
});

EmailTagsInput.displayName = 'EmailTagsInput';
