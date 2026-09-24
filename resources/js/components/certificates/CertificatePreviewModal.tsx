import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ExternalLink, CheckCircle2, FileText, Download } from 'lucide-react';
import { getCertificateDefinition, LANGUAGE_OPTIONS } from '@/config/certificates';
import { useTranslation } from '@/hooks/use-translation';

export interface CertificatePreviewData {
    id?: string;
    type?: string;
    language?: string;
    title?: string;
    custom_type_name?: string;
    custom_language?: string;
    overall?: string;
    listening?: string;
    reading?: string;
    writing?: string;
    speaking?: string;
    sub_scores?: Record<string, string>;
    file_url?: string | null;
    file_name?: string | null;
    status?: string;
}

interface CertificatePreviewModalProps {
    certificate: CertificatePreviewData | null;
    isOpen: boolean;
    onClose: () => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
    certificate,
    isOpen,
    onClose,
}) => {
    const { t } = useTranslation();

    if (!certificate) return null;

    const definition = getCertificateDefinition(certificate.type);
    const isPdf =
        certificate.file_name?.toLowerCase().endsWith('.pdf') ||
        certificate.file_url?.toLowerCase().includes('.pdf');

    const displayTitle =
        certificate.title ||
        (certificate.type === 'other'
            ? certificate.custom_type_name
            : definition.label) ||
        'Language Certificate';

    const langOption = certificate.language
        ? LANGUAGE_OPTIONS.find((l) => l.id === certificate.language)
        : null;
    const languageBadge =
        certificate.custom_language ||
        (langOption
            ? t(langOption.labelKey, langOption.label)
            : t(definition.languageBadgeKey, definition.fallbackLanguageBadge));

    // Collect skills to display
    const renderedSkills: { label: string; value: string }[] = [];
    definition.skills.forEach((skill) => {
        let val = '';
        if (
            (certificate as any)[skill.key] !== undefined &&
            (certificate as any)[skill.key] !== null
        ) {
            val = String((certificate as any)[skill.key]);
        } else if (
            certificate.sub_scores &&
            certificate.sub_scores[skill.key] !== undefined
        ) {
            val = String(certificate.sub_scores[skill.key]);
        }
        if (val) {
            renderedSkills.push({
                label: t(skill.labelKey, skill.fallbackLabel),
                value: val,
            });
        }
    });

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl p-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
                {/* Header */}
                <DialogHeader className="border-b border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/80">
                    <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                                <FileText className="h-5 w-5" />
                            </span>
                            <div>
                                <DialogTitle className="text-base font-extrabold text-[#1E2A5A] dark:text-white">
                                    {displayTitle}
                                </DialogTitle>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                        {languageBadge}
                                    </span>
                                    {certificate.status === 'verified' && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {t('teacher.verified_certificate', 'Verified Certificate')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {certificate.overall && (
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3.5 py-1 text-center dark:border-indigo-900/60 dark:bg-indigo-950/40">
                                <span className="block text-[9px] font-bold uppercase tracking-wider text-indigo-500">
                                    {t(definition.overall.labelKey, definition.overall.fallbackLabel)}
                                </span>
                                <span className="text-base font-extrabold text-indigo-700 dark:text-indigo-300">
                                    {certificate.overall}
                                </span>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {/* Document Body */}
                <div className="max-h-[65vh] overflow-y-auto bg-gray-100/50 p-4 dark:bg-gray-950/50 sm:p-6">
                    {certificate.file_url ? (
                        isPdf ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-2xs dark:bg-gray-800 dark:text-gray-200">
                                    <span className="truncate">
                                        {certificate.file_name || 'certificate.pdf'}
                                    </span>
                                    <a
                                        href={certificate.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        {t('teacher.open_original_file', 'Open Original Document')}
                                    </a>
                                </div>
                                <iframe
                                    src={`${certificate.file_url}#toolbar=0`}
                                    className="h-[52vh] w-full rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900"
                                    title="Certificate PDF Viewer"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-3">
                                <img
                                    src={certificate.file_url}
                                    alt={displayTitle}
                                    className="max-h-[55vh] w-auto max-w-full rounded-xl object-contain shadow-md"
                                />
                                <a
                                    href={certificate.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    {t('teacher.open_original_file', 'Open full size in new tab')}
                                </a>
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-200 text-gray-400 dark:bg-gray-800">
                                <FileText className="h-6 w-6" />
                            </span>
                            <h4 className="mt-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                                Document file not attached
                            </h4>
                            <p className="mt-1 text-xs text-gray-400">
                                The teacher provided their official scores for this certificate.
                            </p>
                        </div>
                    )}
                </div>

                {/* Sub-Scores Footer (if sub-skills present) */}
                {renderedSkills.length > 0 && (
                    <div className="border-t border-gray-100 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                            Section Breakdown
                        </span>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {renderedSkills.map((skill, i) => (
                                <div
                                    key={i}
                                    className="rounded-lg border border-gray-100 bg-gray-50/70 p-2 text-center dark:border-gray-800 dark:bg-gray-800/40"
                                >
                                    <span className="block truncate text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                        {skill.label}
                                    </span>
                                    <span className="text-xs font-extrabold text-[#1E2A5A] dark:text-white">
                                        {skill.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
