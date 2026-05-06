import { Head, router, useForm } from '@inertiajs/react';
import { Github, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Installation = {
    id: number;
    account_login: string;
    account_type: string;
    repository_selection: 'all' | 'selected';
    installed_at: string | null;
    suspended_at: string | null;
};

type Repository = {
    id: number;
    full_name: string;
    private: boolean;
    default_branch: string | null;
    project: {
        uuid: string;
        name: string;
    } | null;
};

type ProjectOption = {
    uuid: string;
    name: string;
};

type Props = {
    installation: Installation | null;
    repositories: Repository[];
    projects: ProjectOption[];
    install_url: string | null;
};

const NONE_VALUE = '__none__';

export default function GithubIntegrationPage({
    installation,
    repositories,
    projects,
    install_url,
}: Props) {
    return (
        <>
            <Head title="GitHub Integration" />

            <div className="flex h-full flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-foreground flex items-center gap-2 text-2xl font-semibold tracking-tight">
                                <Github className="size-6" />
                                GitHub Integration
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Connect a GitHub organization or account so
                                Guardian can read your repositories and (in
                                a later step) propose AI-driven commits and
                                pull requests scoped to a project.
                            </p>
                        </div>

                        {installation === null ? (
                            <InstallButton installUrl={install_url} />
                        ) : (
                            <DisconnectButton />
                        )}
                    </div>

                    {installation !== null ? (
                        <InstallationSummary installation={installation} />
                    ) : null}
                </div>

                {installation === null ? (
                    <EmptyState installUrl={install_url} />
                ) : (
                    <RepositoriesPanel
                        repositories={repositories}
                        projects={projects}
                    />
                )}
            </div>
        </>
    );
}

function InstallButton({ installUrl }: { installUrl: string | null }) {
    if (installUrl === null) {
        return (
            <Badge variant="destructive">
                Configure GITHUB_APP_SLUG to enable installs
            </Badge>
        );
    }

    // Plain anchor (not Inertia <Link>) so the browser does a full-page
    // navigation. The /install route 302s to github.com — Inertia would
    // try to follow the redirect via XHR and the cross-origin response
    // is blocked by CORS.
    return (
        <Button asChild>
            <a href="/integrations/github/install">
                <Github className="size-4" />
                Install on GitHub
            </a>
        </Button>
    );
}

function DisconnectButton() {
    return (
        <Button
            variant="outline"
            onClick={() => {
                if (
                    !window.confirm(
                        'Disconnect GitHub from Guardian? You will also need to uninstall the App from GitHub to fully revoke access.',
                    )
                ) {
                    return;
                }
                router.post(
                    '/integrations/github/disconnect',
                    {},
                    { preserveScroll: true },
                );
            }}
        >
            Disconnect
        </Button>
    );
}

function InstallationSummary({ installation }: { installation: Installation }) {
    return (
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                    Account
                </dt>
                <dd className="text-foreground mt-1 font-medium">
                    {installation.account_login}{' '}
                    <span className="text-muted-foreground text-xs">
                        ({installation.account_type})
                    </span>
                </dd>
            </div>
            <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                    Repository selection
                </dt>
                <dd className="text-foreground mt-1 font-medium capitalize">
                    {installation.repository_selection}
                </dd>
            </div>
            <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                    Status
                </dt>
                <dd className="mt-1">
                    {installation.suspended_at !== null ? (
                        <Badge variant="destructive">Suspended</Badge>
                    ) : (
                        <Badge variant="secondary">Active</Badge>
                    )}
                </dd>
            </div>
        </dl>
    );
}

function EmptyState({ installUrl }: { installUrl: string | null }) {
    return (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
            <p className="text-foreground text-sm font-medium">
                No GitHub installation yet
            </p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-md text-xs">
                Install the Guardian GitHub App on your organization or
                personal account. After authorizing, GitHub will redirect
                you back here and your repositories will appear below.
            </p>
            {installUrl !== null ? (
                <div className="mt-4 inline-flex">
                    <InstallButton installUrl={installUrl} />
                </div>
            ) : null}
        </div>
    );
}

type RepositoryFilter = 'all' | 'linked' | 'unlinked';

function RepositoriesPanel({
    repositories,
    projects,
}: {
    repositories: Repository[];
    projects: ProjectOption[];
}) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<RepositoryFilter>('all');

    const linkedCount = useMemo(
        () => repositories.filter((repo) => repo.project !== null).length,
        [repositories],
    );

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        return repositories.filter((repo) => {
            if (filter === 'linked' && repo.project === null) return false;
            if (filter === 'unlinked' && repo.project !== null) return false;
            if (query !== '' && !repo.full_name.toLowerCase().includes(query)) {
                return false;
            }
            return true;
        });
    }, [repositories, search, filter]);

    if (repositories.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
                <p className="text-foreground text-sm font-medium">
                    No repositories visible to this installation
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                    Select repositories on the GitHub App settings page to
                    grant access, then refresh.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h2 className="text-foreground text-lg font-semibold">
                        Repositories
                    </h2>
                    <p className="text-muted-foreground mt-1 text-xs">
                        {repositories.length}{' '}
                        {repositories.length === 1
                            ? 'repository'
                            : 'repositories'}
                        {' · '}
                        {linkedCount} linked to a project
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative">
                        <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search repositories…"
                            className="w-full pl-8 sm:w-72"
                        />
                    </div>

                    <RepositoryFilterTabs value={filter} onChange={setFilter} />
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center text-sm">
                    No repositories match the current filters.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((repo) => (
                        <RepositoryCard
                            key={repo.id}
                            repository={repo}
                            projects={projects}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function RepositoryFilterTabs({
    value,
    onChange,
}: {
    value: RepositoryFilter;
    onChange: (next: RepositoryFilter) => void;
}) {
    const options: Array<{ key: RepositoryFilter; label: string }> = [
        { key: 'all', label: 'All' },
        { key: 'linked', label: 'Linked' },
        { key: 'unlinked', label: 'Unlinked' },
    ];

    return (
        <div className="bg-muted/50 inline-flex h-9 items-center rounded-md border border-border p-0.5">
            {options.map((option) => {
                const active = option.key === value;
                return (
                    <button
                        key={option.key}
                        type="button"
                        onClick={() => onChange(option.key)}
                        className={
                            'h-8 rounded-sm px-3 text-xs font-medium transition-colors ' +
                            (active
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground')
                        }
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

function RepositoryCard({
    repository,
    projects,
}: {
    repository: Repository;
    projects: ProjectOption[];
}) {
    const form = useForm({
        project_uuid: repository.project?.uuid ?? '',
    });

    const updateLink = (value: string) => {
        const next = value === NONE_VALUE ? '' : value;
        form.setData('project_uuid', next);
        router.post(
            `/integrations/github/repositories/${repository.id}/link`,
            { project_uuid: next },
            { preserveScroll: true },
        );
    };

    const selectValue =
        form.data.project_uuid === '' ? NONE_VALUE : form.data.project_uuid;

    const [owner, name] = splitFullName(repository.full_name);

    return (
        <div className="bg-background flex flex-col gap-3 rounded-lg border border-border p-4 transition-shadow hover:shadow-sm">
            <div className="min-w-0">
                <p
                    className="text-muted-foreground truncate text-xs"
                    title={repository.full_name}
                >
                    {owner}
                </p>
                <p
                    className="text-foreground truncate text-sm font-semibold"
                    title={repository.full_name}
                >
                    {name}
                </p>
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                {repository.private ? (
                    <Badge variant="outline">Private</Badge>
                ) : (
                    <Badge variant="secondary">Public</Badge>
                )}
                {repository.default_branch !== null ? (
                    <span className="truncate">
                        {repository.default_branch}
                    </span>
                ) : null}
            </div>

            <Select value={selectValue} onValueChange={updateLink}>
                <SelectTrigger className="w-full" size="sm">
                    <SelectValue placeholder="Link to a project…" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={NONE_VALUE}>— Not linked —</SelectItem>
                    {projects.map((project) => (
                        <SelectItem key={project.uuid} value={project.uuid}>
                            {project.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function splitFullName(fullName: string): [string, string] {
    const slash = fullName.indexOf('/');
    if (slash === -1) {
        return ['', fullName];
    }
    return [fullName.slice(0, slash), fullName.slice(slash + 1)];
}

GithubIntegrationPage.layout = {
    breadcrumbs: [
        {
            title: 'Integrations',
            href: '/integrations/github',
        },
        {
            title: 'GitHub',
            href: '/integrations/github',
        },
    ],
};
