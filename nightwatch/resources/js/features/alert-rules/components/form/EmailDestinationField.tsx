import { Mail, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    emails: string[];
    onAdd: (email: string) => boolean;
    onRemove: (email: string) => void;
};

/**
 * Chip-style multi-email input. The user types an address, hits Enter or
 * the Add button, and it appears as a removable chip. Validation happens
 * at the hook level (useAlertRuleForm.addEmail returns false on reject).
 */
export function EmailDestinationField({ emails, onAdd, onRemove }: Props) {
    const [draft, setDraft] = React.useState('');

    const commit = () => {
        if (draft.trim() === '') return;
        const accepted = onAdd(draft);
        if (accepted) {
            setDraft('');
        } else {
            toast.error(
                emails.includes(draft.trim().toLowerCase())
                    ? 'That email is already in the list.'
                    : 'Please enter a valid email address.',
            );
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commit();
        }
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="rule-email-input">Email recipients</Label>

            <div className="flex gap-2">
                <Input
                    id="rule-email-input"
                    type="email"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ops@example.com"
                />
                <Button type="button" variant="outline" onClick={commit}>
                    Add
                </Button>
            </div>

            {emails.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {emails.map((email) => (
                        <Badge
                            key={email}
                            variant="outline"
                            className="gap-1.5 pl-2 pr-1 py-1 font-normal"
                        >
                            <Mail className="size-3" />
                            <span className="text-xs">{email}</span>
                            <button
                                type="button"
                                onClick={() => onRemove(email)}
                                className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-sm p-0.5"
                                aria-label={`Remove ${email}`}
                            >
                                <X className="size-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-xs">
                    Press Enter or click Add to attach an email recipient. The
                    rule will email each address when it fires.
                </p>
            )}
        </div>
    );
}
