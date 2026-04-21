import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
    searchQuery: string;
    onSearchChange: (query: string) => void;
};

export function DashboardToolbar({ searchQuery, onSearchChange }: Props) {
    return (
        <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
                <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="bg-muted/50 border-border/50 pl-9 h-9"
                />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
                <Filter className="size-3.5" />
                Filter
            </Button>
        </div>
    );
}
