import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminPagination, { PaginationLink } from '@/components/AdminPagination';
import { Copy, Download, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
    exportStudentsCsv,
    students as studentsRoute,
} from '@/actions/App/Http/Controllers/PartnerPortalController';

interface StudentRow {
    attribution_id: string;
    pupil_id: string;
    full_name: string;
    email: string;
    phone_number?: string | null;
    attribution_source: string;
    attributed_at?: string | null;
    p2p_tier: 'unlimited' | 'attributed_2x';
    p2p_tier_label: string;
    partner_pass_expires_at?: string | null;
    completed_lessons_count: number;
    total_net_cash_uzs: number;
    total_commission_uzs: number;
    last_activity_at?: string | null;
}

interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    per_page: number;
}

interface Props {
    organization: {
        id: string;
        name: string;
        partner_code: string;
        referral_url: string;
    };
    students: Paginated<StudentRow>;
    search: string;
}

const formatUzs = (amount: number | null | undefined): string =>
    `${new Intl.NumberFormat('en-US').format(amount ?? 0)} UZS`;

const sourceBadge = (source: string): string => {
    if (source === 'manual_code') return 'Manual Code';
    if (source === 'referral_link') return 'Referral Link';
    return source.replaceAll('_', ' ');
};

export default function PartnerStudents({ organization, students, search }: Props) {
    const [searchInput, setSearchInput] = useState(search);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            studentsRoute.url(),
            searchInput.trim() ? { search: searchInput.trim() } : {},
            { preserveState: true },
        );
    };

    const exportHref = searchInput.trim()
        ? `${exportStudentsCsv.url()}?search=${encodeURIComponent(searchInput.trim())}`
        : exportStudentsCsv.url();

    return (
        <AppLayout>
            <Head title={`Attributed Students — ${organization.name}`} />

            <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                            <Users className="h-6 w-6 text-primary" />
                            Attributed Students
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Full directory of students onboarded under {organization.name} ({students.total} total).
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                navigator.clipboard?.writeText(organization.referral_url);
                                toast.success('Referral link copied');
                            }}
                            className="gap-1.5"
                        >
                            <Copy className="h-4 w-4" />
                            Copy Invite Link
                        </Button>
                        <Button asChild className="gap-1.5">
                            <a href={exportHref}>
                                <Download className="h-4 w-4" />
                                Export Students CSV
                            </a>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <CardTitle className="text-base">Student Roster & Revenue Attribution</CardTitle>
                            <CardDescription>
                                Shows student contact details, P2P tier, active Partner Pass expiry, completed lessons, and commission earned.
                            </CardDescription>
                        </div>
                        <form onSubmit={handleSearch} className="flex w-full max-w-sm gap-2">
                            <Input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search name, email, or phone..."
                            />
                            <Button type="submit" variant="outline" className="gap-1.5">
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </form>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {students.data.length === 0 ? (
                            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                No attributed students found matching your filter.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b text-xs text-muted-foreground">
                                            <th className="pb-2 font-medium">Student</th>
                                            <th className="pb-2 font-medium">Attribution</th>
                                            <th className="pb-2 font-medium">P2P Tier / Pass</th>
                                            <th className="pb-2 font-medium">Lessons</th>
                                            <th className="pb-2 font-medium">Net Cash GMV</th>
                                            <th className="pb-2 font-medium">Center Share</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {students.data.map((student) => (
                                            <tr key={student.attribution_id}>
                                                <td className="py-3 pr-3">
                                                    <div className="font-medium">{student.full_name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {student.email}
                                                        {student.phone_number ? ` · ${student.phone_number}` : ''}
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-3 text-xs">
                                                    <Badge variant="outline" className="capitalize">
                                                        {sourceBadge(student.attribution_source)}
                                                    </Badge>
                                                    <div className="mt-1 text-muted-foreground">
                                                        {student.attributed_at
                                                            ? new Date(student.attributed_at).toLocaleDateString()
                                                            : '—'}
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-3 text-xs">
                                                    <Badge
                                                        variant={student.p2p_tier === 'unlimited' ? 'default' : 'secondary'}
                                                    >
                                                        {student.p2p_tier_label}
                                                    </Badge>
                                                    {student.partner_pass_expires_at && (
                                                        <div className="mt-1 text-muted-foreground">
                                                            Expires {new Date(student.partner_pass_expires_at).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 pr-3 font-medium">{student.completed_lessons_count}</td>
                                                <td className="py-3 pr-3 text-xs">{formatUzs(student.total_net_cash_uzs)}</td>
                                                <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {formatUzs(student.total_commission_uzs)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <AdminPagination
                            links={students.links}
                            from={students.from}
                            to={students.to}
                            total={students.total}
                            perPage={students.per_page}
                            itemLabel="students"
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

