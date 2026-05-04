import { router } from '@inertiajs/react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { AlertRule } from '../types';

type Props = {
    rule: AlertRule | null;
    onClose: () => void;
};

export function DeleteRuleAlertDialog({ rule, onClose }: Props) {
    const confirm = () => {
        if (!rule) return;
        router.delete(`/alert-rules/${rule.id}`, {
            preserveScroll: true,
            onFinish: onClose,
        });
    };

    return (
        <AlertDialog
            open={rule !== null}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete this rule?</AlertDialogTitle>
                    <AlertDialogDescription>
                        "{rule?.name}" will stop evaluating immediately. Past
                        firings stay in history.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={confirm}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
