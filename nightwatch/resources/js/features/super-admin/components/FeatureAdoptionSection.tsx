import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
    teamTotal: number;
    teamsWithWebhooks: number;
    teamsWithEmailReports: number;
    webhooksPercent: number;
    emailReportsPercent: number;
};

export function FeatureAdoptionSection({
    teamTotal,
    teamsWithWebhooks,
    teamsWithEmailReports,
    webhooksPercent,
    emailReportsPercent,
}: Props) {
    if (teamTotal === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-foreground text-base font-semibold">Feature adoption (teams)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">No teams to measure yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-base font-semibold">Feature adoption (teams)</CardTitle>
                <p className="text-muted-foreground text-xs">Share of teams with at least one enabled integration.</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="text-muted-foreground flex justify-between text-sm">
                        <span>Webhooks (destinations)</span>
                        <span className="text-foreground font-medium">
                            {teamsWithWebhooks} / {teamTotal} ({webhooksPercent.toFixed(1)}%)
                        </span>
                    </div>
                    <div className="bg-muted mt-1 h-2 w-full overflow-hidden rounded-full">
                        <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, webhooksPercent)}%` }}
                        />
                    </div>
                </div>
                <div>
                    <div className="text-muted-foreground flex justify-between text-sm">
                        <span>Email reports (any member, enabled)</span>
                        <span className="text-foreground font-medium">
                            {teamsWithEmailReports} / {teamTotal} ({emailReportsPercent.toFixed(1)}%)
                        </span>
                    </div>
                    <div className="bg-muted mt-1 h-2 w-full overflow-hidden rounded-full">
                        <div
                            className="h-2 rounded-full bg-emerald-500/80 transition-all"
                            style={{ width: `${Math.min(100, emailReportsPercent)}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
