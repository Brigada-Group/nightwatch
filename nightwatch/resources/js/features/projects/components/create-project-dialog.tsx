import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import * as React from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormShape = {
    name: string;
    description: string;
    environment: string;
};

export function CreateProjectDialog() {
    const [open, setOpen] = React.useState(false);

    const form = useForm<FormShape>({
        name: '',
        description: '',
        environment: 'production',
    });

    const submit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        form.post('/projects', {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (!next) {
                    form.clearErrors();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button type="button" className="gap-2">
                    <Plus className="size-4" />
                    New project
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Register a new project</DialogTitle>
                    <DialogDescription>
                        We will generate a{' '}
                        <span className="text-foreground font-medium">
                            project ID
                        </span>{' '}
                        and an{' '}
                        <span className="text-foreground font-medium">
                            API token
                        </span>{' '}
                        that Guardian will use to authenticate this app.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="project-name">Name</Label>
                        <Input
                            id="project-name"
                            autoFocus
                            required
                            maxLength={120}
                            placeholder="Acme storefront"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="project-environment">Environment</Label>
                        <Input
                            id="project-environment"
                            required
                            maxLength={40}
                            placeholder="production, staging, local…"
                            value={form.data.environment}
                            onChange={(e) =>
                                form.setData('environment', e.target.value)
                            }
                        />
                        <InputError message={form.errors.environment} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="project-description">
                            Description{' '}
                            <span className="text-muted-foreground text-xs font-normal">
                                (optional)
                            </span>
                        </Label>
                        <Input
                            id="project-description"
                            maxLength={500}
                            placeholder="Short note for your team"
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                        />
                        <InputError message={form.errors.description} />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Creating…' : 'Create project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
