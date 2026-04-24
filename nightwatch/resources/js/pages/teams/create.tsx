import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/teams';

export default function CreateTeam() {
    return (
        <>
            <Head title="Create your team" />
            <Form
                {...store.form()}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Team name</Label>
                            <Input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="organization"
                                name="name"
                                placeholder="Acme Inc."
                                maxLength={120}
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">
                                Description{' '}
                                <span className="text-muted-foreground text-xs font-normal">
                                    (optional)
                                </span>
                            </Label>
                            <Input
                                id="description"
                                type="text"
                                tabIndex={2}
                                name="description"
                                placeholder="What does this team work on?"
                                maxLength={500}
                            />
                            <InputError message={errors.description} />
                        </div>

                        <Button
                            type="submit"
                            className="mt-2 w-full"
                            tabIndex={3}
                            data-test="create-team-button"
                        >
                            {processing && <Spinner />}
                            Create team
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

CreateTeam.layout = {
    title: 'Create your team',
    description: 'Teams let you collaborate on projects with invited members.',
};
