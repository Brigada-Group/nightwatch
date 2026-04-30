import { Check, ClipboardCopy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';

type Props = {
    markdown: string;
    label?: string;
};

const RESET_AFTER_MS = 1500;

export function CopyMarkdownButton({
    markdown,
    label = 'Copy as Markdown',
}: Props) {
    const [, copy] = useClipboard();
    const [copied, setCopied] = useState(false);
    const resetTimer = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (resetTimer.current !== null) {
                window.clearTimeout(resetTimer.current);
            }
        };
    }, []);

    const onCopy = async () => {
        const ok = await copy(markdown);

        if (!ok) {
            toast.error('Unable to copy to clipboard');
            return;
        }

        setCopied(true);
        toast.success('Markdown copied to clipboard');

        if (resetTimer.current !== null) {
            window.clearTimeout(resetTimer.current);
        }
        resetTimer.current = window.setTimeout(() => {
            setCopied(false);
            resetTimer.current = null;
        }, RESET_AFTER_MS);
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="gap-2"
        >
            {copied ? (
                <>
                    <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                    Copied
                </>
            ) : (
                <>
                    <ClipboardCopy className="size-4" />
                    {label}
                </>
            )}
        </Button>
    );
}
