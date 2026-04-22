import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppearance } from '@/hooks/use-appearance';

export function ThemeToggle({ className }: { className?: string }) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
                    className={className}
                >
                    {isDark ? (
                        <Sun className="size-4" />
                    ) : (
                        <Moon className="size-4" />
                    )}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            </TooltipContent>
        </Tooltip>
    );
}
