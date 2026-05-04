import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatSeconds } from '../utils/formatters';
import type { AlertRule } from '../types';
import { RuleStateBadge } from './RuleStateBadge';
import { SeverityBadge } from './SeverityBadge';

type Props = {
    rules: AlertRule[];
    onEdit: (rule: AlertRule) => void;
    onDelete: (rule: AlertRule) => void;
};

export function AlertRulesTable({ rules, onEdit, onDelete }: Props) {
    if (rules.length === 0) {
        return (
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell className="text-muted-foreground py-10 text-center text-sm">
                            No alert rules yet. Create one to get started.
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Window</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Destinations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rules.map((rule) => (
                    <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                            {rule.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                            {rule.type_label}
                        </TableCell>
                        <TableCell className="text-xs">
                            {rule.project ? rule.project.name : 'All projects'}
                        </TableCell>
                        <TableCell>
                            <SeverityBadge severity={rule.severity} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs tabular-nums">
                            {formatSeconds(rule.window_seconds)}
                        </TableCell>
                        <TableCell>
                            <RuleStateBadge
                                isEnabled={rule.is_enabled}
                                isCurrentlyFiring={rule.is_currently_firing}
                            />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                            {rule.destinations.length === 0
                                ? 'none'
                                : rule.destinations
                                      .map((d) => d.webhook?.name ?? '?')
                                      .join(', ')}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(rule)}
                                    className="h-8 w-8 p-0"
                                >
                                    <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(rule)}
                                    className="text-destructive h-8 w-8 p-0"
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
