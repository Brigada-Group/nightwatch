import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
    value: number;
    label: string;
    teamsWow: number | null;
    usersWow: number | null;
};

export function GrowingFactorCard({ value, label, teamsWow, usersWow }: Props) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base font-semibold">Growing factor (7d)</CardTitle>
                <p className="text-muted-foreground text-xs">{label}</p>
            </CardHeader>
            <CardContent>
                <p className="text-foreground text-3xl font-bold tabular-nums">
                    {value > 0 ? '+' : ''}
                    {value.toFixed(1)}%
                </p>
                <dl className="text-muted-foreground mt-3 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                    <div>
                        <dt className="text-muted-foreground/80">Teams WoW</dt>
                        <dd className="text-foreground font-medium">
                            {teamsWow === null ? '—' : `${teamsWow > 0 ? '+' : ''}${teamsWow.toFixed(1)}%`}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground/80">Users WoW</dt>
                        <dd className="text-foreground font-medium">
                            {usersWow === null ? '—' : `${usersWow > 0 ? '+' : ''}${usersWow.toFixed(1)}%`}
                        </dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    );
}
