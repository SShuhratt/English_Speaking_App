import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, ShieldAlert, Sparkles, MessageSquare, ExternalLink, GraduationCap, FileText, Edit, Check } from 'lucide-react';

interface TeacherProfile {
    id: string;
    overall_level?: string;
    speaking_band?: string | number;
    price?: number;
    is_verified?: boolean;
    certificates?: any;
}

interface Teacher {
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
    created_at: string;
    teacher_profile?: TeacherProfile;
    unread_messages_count?: number;
    is_new?: boolean;
}

interface Props {
    teachers: {
        data: Teacher[];
        links: any[];
    };
    currentFilter: string;
}

export default function AdminTeachers({ teachers, currentFilter }: Props) {
    const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
    const [editingCerts, setEditingCerts] = useState<any[]>([]);
    const [editingOverallLevel, setEditingOverallLevel] = useState<string>('');
    const [editingSpeakingBand, setEditingSpeakingBand] = useState<string>('');

    const handleToggleVerify = (id: string, currentStatus?: boolean) => {
        router.post(`/admin/teachers/${id}/verify`, {
            verified: !currentStatus,
        });
    };

    const setFilter = (filter: string) => {
        router.get('/admin/teachers', { status: filter }, { preserveState: true });
    };

    const openEditModal = (teacher: Teacher) => {
        const rawCerts = teacher.teacher_profile?.certificates ?? [];
        const certsArray = typeof rawCerts === 'string' ? JSON.parse(rawCerts) : rawCerts;
        const normalized = (Array.isArray(certsArray) ? certsArray : []).map((c: any) => {
            if (typeof c === 'string') {
                const isUrl = c.startsWith('http') || c.startsWith('/storage');
                return {
                    type: 'ielts',
                    custom_type_name: '',
                    title: isUrl ? 'IELTS Certificate' : c,
                    overall: '',
                    listening: '',
                    reading: '',
                    writing: '',
                    speaking: '',
                    file_url: isUrl ? c : null,
                    file_name: isUrl ? c.substring(c.lastIndexOf('/') + 1) : '',
                    status: 'verified',
                };
            }
            return {
                type: c.type ?? 'ielts',
                custom_type_name: c.custom_type_name ?? '',
                title: c.title ?? '',
                overall: String(c.overall ?? ''),
                listening: String(c.listening ?? ''),
                reading: String(c.reading ?? ''),
                writing: String(c.writing ?? ''),
                speaking: String(c.speaking ?? ''),
                file_url: c.file_url ?? null,
                file_name: c.file_name ?? '',
                status: c.status ?? 'pending',
            };
        });

        setEditingTeacherId(teacher.id);
        setEditingCerts(normalized);
        setEditingOverallLevel(teacher.teacher_profile?.overall_level ?? '');
        setEditingSpeakingBand(String(teacher.teacher_profile?.speaking_band ?? ''));
    };

    const updateCertScore = (index: number, field: string, val: string) => {
        setEditingCerts((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: val };
            return next;
        });
    };

    const saveCertificates = (teacherId: string) => {
        router.post(
            `/admin/teachers/${teacherId}/certificates`,
            {
                certificates: editingCerts,
                overall_level: editingOverallLevel,
                speaking_band: editingSpeakingBand,
            },
            {
                onSuccess: () => setEditingTeacherId(null),
            }
        );
    };

    return (
        <>
            <Head title="Admin - Teacher Management" />

            <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
                {/* Header Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-md">
                            <GraduationCap className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold md:text-3xl">Teacher Directory & Verification</h1>
                            <p className="mt-1 text-sm text-blue-100">
                                Verify profiles, inspect uploaded certificate files (Admin exclusive), and adjust band scores.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter & List Card */}
                <Card className="shadow-md">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">Registered Teachers</CardTitle>
                            <CardDescription>
                                Filter by status, inspect documents, and edit certificate scores.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                            <Button
                                size="sm"
                                variant={currentFilter === 'all' ? 'default' : 'ghost'}
                                onClick={() => setFilter('all')}
                                className={currentFilter === 'all' ? 'bg-indigo-600 text-white' : ''}
                            >
                                All Teachers
                            </Button>
                            <Button
                                size="sm"
                                variant={currentFilter === 'verified' ? 'default' : 'ghost'}
                                onClick={() => setFilter('verified')}
                                className={currentFilter === 'verified' ? 'bg-indigo-600 text-white' : ''}
                            >
                                Verified
                            </Button>
                            <Button
                                size="sm"
                                variant={currentFilter === 'new' ? 'default' : 'ghost'}
                                onClick={() => setFilter('new')}
                                className={currentFilter === 'new' ? 'bg-indigo-600 text-white' : ''}
                            >
                                New (7 Days)
                            </Button>
                            <Button
                                size="sm"
                                variant={currentFilter === 'unverified' ? 'default' : 'ghost'}
                                onClick={() => setFilter('unverified')}
                                className={currentFilter === 'unverified' ? 'bg-indigo-600 text-white' : ''}
                            >
                                Unverified
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3">Teacher Info</th>
                                        <th className="px-4 py-3">Qualification / Level</th>
                                        <th className="px-4 py-3">Status Badges</th>
                                        <th className="px-4 py-3">Unread Support</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {teachers.data.map((teacher) => {
                                        const isVerified = Boolean(teacher.teacher_profile?.is_verified);
                                        const isEditing = editingTeacherId === teacher.id;

                                        return (
                                            <React.Fragment key={teacher.id}>
                                                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarImage src={teacher.avatar} />
                                                                <AvatarFallback>{teacher.full_name?.substring(0, 2) || 'T'}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <Link
                                                                        href={`/profile/${teacher.id}`}
                                                                        className="font-medium text-indigo-600 hover:underline flex items-center gap-1"
                                                                    >
                                                                        {teacher.full_name}
                                                                        <ExternalLink className="h-3 w-3" />
                                                                    </Link>
                                                                    <span className="inline-flex items-center rounded bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                                        ID: {teacher.id.substring(0, 8)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-500">{teacher.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-300">
                                                        <div>Level: {teacher.teacher_profile?.overall_level || 'Not set'}</div>
                                                        <div>Speaking: {teacher.teacher_profile?.speaking_band || 'N/A'}</div>
                                                        <div>Hourly Rate: {teacher.teacher_profile?.price ? `${Number(teacher.teacher_profile.price).toLocaleString()} so'm` : "0 so'm"}</div>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {isVerified ? (
                                                                <Badge className="bg-emerald-600 text-white flex items-center gap-1">
                                                                    <ShieldCheck className="h-3 w-3" /> Verified
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40">
                                                                    <ShieldAlert className="h-3 w-3 mr-1" /> Unverified
                                                                </Badge>
                                                            )}

                                                            {teacher.is_new && (
                                                                <Badge className="bg-blue-600 text-white flex items-center gap-1">
                                                                    <Sparkles className="h-3 w-3" /> New Teacher
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        {(teacher.unread_messages_count || 0) > 0 ? (
                                                            <Link href={`/admin/support?user_id=${teacher.id}`}>
                                                                <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                                                    <MessageSquare className="h-3 w-3" />
                                                                    {teacher.unread_messages_count} Unread
                                                                </Badge>
                                                            </Link>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">No unread messages</span>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 flex-wrap">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => (isEditing ? setEditingTeacherId(null) : openEditModal(teacher))}
                                                                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                            >
                                                                <Edit className="h-3.5 w-3.5 mr-1" />
                                                                {isEditing ? 'Close' : 'Inspect & Edit Scores'}
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant={isVerified ? 'outline' : 'default'}
                                                                onClick={() => handleToggleVerify(teacher.id, isVerified)}
                                                                className={!isVerified ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                                                            >
                                                                {isVerified ? 'Unverify' : 'Verify Teacher'}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded Admin Inspection & Edit Row */}
                                                {isEditing && (
                                                    <tr>
                                                        <td colSpan={5} className="bg-indigo-50/40 p-4 dark:bg-indigo-950/20">
                                                            <div className="space-y-4 rounded-xl border border-indigo-200 bg-white p-5 shadow-inner dark:border-indigo-900 dark:bg-gray-900">
                                                                <div className="flex items-center justify-between border-b pb-3">
                                                                    <h3 className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                                                                        <FileText className="h-4 w-4 text-indigo-600" />
                                                                        Admin Certificate Inspection & Score Editor — {teacher.full_name}
                                                                    </h3>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => saveCertificates(teacher.id)}
                                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                                                    >
                                                                        <Check className="h-4 w-4 mr-1" /> Save Changes
                                                                    </Button>
                                                                </div>

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <Label className="text-xs font-bold">Overall Level Cache (e.g., IELTS 8.5 / CEFR C1)</Label>
                                                                        <Input
                                                                            type="text"
                                                                            value={editingOverallLevel}
                                                                            onChange={(e) => setEditingOverallLevel(e.target.value)}
                                                                            className="mt-1 text-xs"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-xs font-bold">Speaking Band Cache (e.g., 8.5)</Label>
                                                                        <Input
                                                                            type="text"
                                                                            value={editingSpeakingBand}
                                                                            onChange={(e) => setEditingSpeakingBand(e.target.value)}
                                                                            className="mt-1 text-xs"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4 pt-2">
                                                                    <h4 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">
                                                                        Certificates & Official Files
                                                                    </h4>
                                                                    {editingCerts.length === 0 ? (
                                                                        <p className="text-xs text-gray-500 italic">No certificates submitted by this teacher.</p>
                                                                    ) : (
                                                                        editingCerts.map((cert, cIdx) => (
                                                                            <div key={cIdx} className="rounded-xl border p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-xs text-indigo-700 dark:text-indigo-300">
                                                                                            {cert.title || cert.type?.toUpperCase() || `Certificate #${cIdx + 1}`}
                                                                                        </span>
                                                                                        {cert.file_url ? (
                                                                                            <a
                                                                                                href={cert.file_url}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline bg-white dark:bg-gray-900 border px-2.5 py-1 rounded-md"
                                                                                            >
                                                                                                <ExternalLink className="h-3 w-3" /> View Uploaded Document ({cert.file_name || 'File'})
                                                                                            </a>
                                                                                        ) : (
                                                                                            <span className="text-xs text-gray-400">No document attached</span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Label className="text-xs">Status:</Label>
                                                                                        <select
                                                                                            value={cert.status || 'pending'}
                                                                                            onChange={(e) => updateCertScore(cIdx, 'status', e.target.value)}
                                                                                            className="rounded border text-xs px-2 py-1 bg-white dark:bg-gray-900"
                                                                                        >
                                                                                            <option value="pending">Under review</option>
                                                                                            <option value="verified">Verified</option>
                                                                                        </select>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                                                                    <div>
                                                                                        <Label className="text-[11px] font-bold">Overall</Label>
                                                                                        <Input
                                                                                            type="text"
                                                                                            value={cert.overall || ''}
                                                                                            onChange={(e) => updateCertScore(cIdx, 'overall', e.target.value)}
                                                                                            className="mt-1 h-8 text-xs font-bold"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <Label className="text-[11px] font-bold">Listening</Label>
                                                                                        <Input
                                                                                            type="text"
                                                                                            value={cert.listening || ''}
                                                                                            onChange={(e) => updateCertScore(cIdx, 'listening', e.target.value)}
                                                                                            className="mt-1 h-8 text-xs"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <Label className="text-[11px] font-bold">Reading</Label>
                                                                                        <Input
                                                                                            type="text"
                                                                                            value={cert.reading || ''}
                                                                                            onChange={(e) => updateCertScore(cIdx, 'reading', e.target.value)}
                                                                                            className="mt-1 h-8 text-xs"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <Label className="text-[11px] font-bold">Writing</Label>
                                                                                        <Input
                                                                                            type="text"
                                                                                            value={cert.writing || ''}
                                                                                            onChange={(e) => updateCertScore(cIdx, 'writing', e.target.value)}
                                                                                            className="mt-1 h-8 text-xs"
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <Label className="text-[11px] font-bold">Speaking</Label>
                                                                                        <Input
                                                                                            type="text"
                                                                                            value={cert.speaking || ''}
                                                                                            onChange={(e) => updateCertScore(cIdx, 'speaking', e.target.value)}
                                                                                            className="mt-1 h-8 text-xs"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminTeachers.layout = {
    breadcrumbs: [{ title: 'Manage Teachers', href: '/admin/teachers' }],
};
