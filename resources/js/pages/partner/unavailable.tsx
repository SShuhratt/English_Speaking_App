import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface Props {
    organizationName?: string | null;
    organizationStatus: string;
}

export default function PartnerUnavailable({ organizationName, organizationStatus }: Props) {
    return (
        <AppLayout>
            <Head title="Partner Portal Unavailable" />

            <div className="mx-auto max-w-xl p-6">
                <Card className="border-amber-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            Partner Portal Access Unavailable
                        </CardTitle>
                        <CardDescription>
                            {organizationName ? `${organizationName} — ` : ''}
                            Status: <span className="font-medium capitalize">{organizationStatus}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>
                            {organizationStatus === 'unassigned'
                                ? 'Your account is not currently assigned to an active partner learning center. Please ask ConvoMate Support or your Administrator to link your staff membership.'
                                : 'Your learning center partnership is currently paused or inactive. Historical records remain preserved, and access will resume once your organization is reactivated.'}
                        </p>
                        <Button variant="outline" asChild className="gap-1.5">
                            <Link href="/support">
                                <HelpCircle className="h-4 w-4" />
                                Contact ConvoMate Support
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

