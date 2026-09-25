import React from 'react';
import { Trash2, FileText, Upload, X, RefreshCw, Award, Eye } from 'lucide-react';
import {
    CERTIFICATE_DEFINITIONS,
    getCertificateDefinition,
    LANGUAGE_OPTIONS,
    getAvailableExamsForLanguage,
    getDefaultLanguageForExam,
} from '@/config/certificates';
import { useTranslation } from '@/hooks/use-translation';

export interface CertificateData {
    id?: string | number;
    type: string;
    language?: string;
    custom_type_name?: string;
    custom_language?: string;
    overall?: string;
    listening?: string;
    reading?: string;
    writing?: string;
    speaking?: string;
    // Dynamic sub-scores map for non-standard skills (e.g. literacy, comprehension, etc.)
    sub_scores?: Record<string, string>;
    [key: string]: any;
    file?: File | null;
    file_url?: string | null;
    file_name?: string | null;
    isExisting?: boolean;
    status?: string;
}

interface CertificateInputCardProps {
    index: number;
    cert: CertificateData;
    onChange: (updated: CertificateData) => void;
    onRemove?: () => void;
    canRemove?: boolean;
    readOnly?: boolean;
}

export const CertificateInputCard: React.FC<CertificateInputCardProps> = ({
    index,
    cert,
    onChange,
    onRemove,
    canRemove = true,
    readOnly = false,
}) => {
    const { t } = useTranslation();
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const currentLanguage =
        cert.language || getDefaultLanguageForExam(cert.type) || 'english';

    const availableExams = React.useMemo(() => {
        return getAvailableExamsForLanguage(currentLanguage);
    }, [currentLanguage]);

    const definition = React.useMemo(() => {
        return getCertificateDefinition(cert.type);
    }, [cert.type]);

    // Handle Language change: adjust available exams and default exam if invalid
    const handleLanguageChange = (newLang: string) => {
        const examsForNewLang = getAvailableExamsForLanguage(newLang);
        const isCurrentExamValid = examsForNewLang.some((e) => e.id === cert.type);
        const newType = isCurrentExamValid
            ? cert.type
            : examsForNewLang[0]?.id || 'cefr';

        onChange({
            ...cert,
            language: newLang,
            type: newType,
            custom_language: newLang === 'other' ? cert.custom_language : '',
            ...(isCurrentExamValid ? {} : { sub_scores: {} }),
        });
    };

    // Handle Certificate Type change
    const handleTypeChange = (newType: string) => {
        onChange({
            ...cert,
            type: newType,
            // Keep overall and reset irrelevant skills if exam changes
        });
    };

    // Helper to get skill value (checks cert[key] or cert.sub_scores[key])
    const getSkillValue = (skillKey: string): string => {
        if (cert[skillKey] !== undefined && cert[skillKey] !== null) {
            return String(cert[skillKey]);
        }
        if (cert.sub_scores && cert.sub_scores[skillKey] !== undefined) {
            return String(cert.sub_scores[skillKey]);
        }
        return '';
    };

    // Helper to update skill value
    const handleSkillChange = (skillKey: string, value: string) => {
        const updatedSubScores = { ...(cert.sub_scores || {}) };
        updatedSubScores[skillKey] = value;

        onChange({
            ...cert,
            [skillKey]: value, // Also set top-level for backward-compatibility with listening/reading/writing/speaking
            sub_scores: updatedSubScores,
        });
    };

    // File selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const selectedFile = files[0];
            onChange({
                ...cert,
                file: selectedFile,
                file_name: selectedFile.name,
            });
        }
    };

    // Remove attached file
    const handleRemoveFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onChange({
            ...cert,
            file: null,
            file_name: null,
            file_url: null,
        });
    };

    // Determine current attached file name
    const currentFileName = cert.file ? cert.file.name : cert.file_name;
    const hasFile = Boolean(currentFileName || cert.file_url);

    // Format file size helper if File object is available
    const fileSizeFormatted = React.useMemo(() => {
        if (!cert.file) return null;
        const kb = cert.file.size / 1024;
        if (kb > 1024) {
            return `${(kb / 1024).toFixed(1)} MB`;
        }
        return `${Math.round(kb)} KB`;
    }, [cert.file]);

    return (
        <div className="space-y-4 rounded-2xl border border-gray-200/90 bg-white p-4 shadow-xs transition-all dark:border-gray-800 dark:bg-gray-900/60">
            {/* Header: Language selector + Exam selector + Remove */}
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                        <Award className="h-4 w-4" />
                    </span>

                    {/* 1. Language Picker (BEFORE Certificate) */}
                    <select
                        name={`certificates[${index}][language]`}
                        value={currentLanguage}
                        disabled={readOnly}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        aria-label={t('auth.select_language', 'Select Language')}
                        className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                        {LANGUAGE_OPTIONS.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                                {t(lang.labelKey, lang.label)}
                            </option>
                        ))}
                    </select>

                    {/* 2. Certificate / Exam Picker (Filtered by selected language) */}
                    <select
                        name={`certificates[${index}][type]`}
                        value={cert.type || availableExams[0]?.id || 'ielts'}
                        disabled={readOnly}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        aria-label={t('auth.select_certificate', 'Select Certificate')}
                        className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                        {availableExams.map((def) => (
                            <option key={def.id} value={def.id}>
                                {def.label}
                            </option>
                        ))}
                    </select>

                    {readOnly && (
                        <>
                            <input
                                type="hidden"
                                name={`certificates[${index}][language]`}
                                value={currentLanguage}
                            />
                            <input
                                type="hidden"
                                name={`certificates[${index}][type]`}
                                value={cert.type || availableExams[0]?.id || 'ielts'}
                            />
                        </>
                    )}
                </div>

                {canRemove && !readOnly && onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        title={t('auth.remove_certificate', 'Remove')}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Custom Language Name (shown when Language is 'other') */}
            {currentLanguage === 'other' && (
                <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400">
                        {t('auth.custom_language_label', 'Language Name')}
                    </label>
                    <input
                        type="text"
                        name={`certificates[${index}][custom_language]`}
                        readOnly={readOnly}
                        value={cert.custom_language || ''}
                        onChange={(e) =>
                            onChange({ ...cert, custom_language: e.target.value })
                        }
                        placeholder={t(
                            'auth.custom_language_placeholder',
                            'e.g. Polish, Dutch, Portuguese',
                        )}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                </div>
            )}

            {/* Custom Certificate Name (for Other Certificate) */}
            {definition.requiresCustomName && (
                <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400">
                        {t('auth.custom_cert_placeholder', 'Certificate Name')}
                    </label>
                    <input
                        type="text"
                        name={`certificates[${index}][custom_type_name]`}
                        readOnly={readOnly}
                        value={cert.custom_type_name || ''}
                        onChange={(e) =>
                            onChange({ ...cert, custom_type_name: e.target.value })
                        }
                        placeholder="e.g. Oxford Test of English, PTE, Pearson"
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                </div>
            )}

            {/* Overall Score Row */}
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        {t(definition.overall.labelKey, definition.overall.fallbackLabel)}
                    </label>
                    <span className="text-[10px] font-semibold text-gray-400">
                        {definition.overall.hint}
                    </span>
                </div>

                {definition.overall.options ? (
                    <select
                        name={`certificates[${index}][overall]`}
                        disabled={readOnly}
                        value={cert.overall || ''}
                        onChange={(e) => onChange({ ...cert, overall: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                        <option value="">{t('auth.select_level', 'Select Level')}</option>
                        {definition.overall.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type={definition.overall.step ? 'number' : 'text'}
                        name={`certificates[${index}][overall]`}
                        readOnly={readOnly}
                        min={definition.overall.min}
                        max={definition.overall.max}
                        step={definition.overall.step}
                        value={cert.overall || ''}
                        onChange={(e) => onChange({ ...cert, overall: e.target.value })}
                        placeholder={definition.overall.placeholder}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                )}
            </div>

            {/* Dynamic Sub-Skills Grid (if any skills defined) */}
            {definition.skills.length > 0 && (
                <div className="space-y-1.5 pt-1">
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {definition.skills.map((skill) => {
                            const val = getSkillValue(skill.key);
                            return (
                                <div key={skill.key} className="min-w-0">
                                    <label className="block truncate text-[11px] font-bold text-gray-600 dark:text-gray-400">
                                        {t(skill.labelKey, skill.fallbackLabel)}
                                    </label>
                                    <input
                                        type={skill.step ? 'number' : 'text'}
                                        name={`certificates[${index}][${skill.key}]`}
                                        readOnly={readOnly}
                                        min={skill.min}
                                        max={skill.max}
                                        step={skill.step}
                                        value={val}
                                        onChange={(e) =>
                                            handleSkillChange(skill.key, e.target.value)
                                        }
                                        placeholder={skill.placeholder}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    <span className="mt-0.5 block truncate text-[9px] font-medium text-gray-400">
                                        {skill.hint}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* File Upload / Attachment Block */}
            <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400">
                    {t('auth.cert_file_optional', 'Certificate file (optional)')}
                </label>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    name={`certificate_files[${index}]`}
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    disabled={readOnly}
                    onChange={handleFileChange}
                    className="hidden"
                />

                {hasFile ? (
                    /* Attached File Card with Replace and Delete */
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 p-2.5 dark:border-gray-800 dark:bg-gray-800/40">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-2xs dark:bg-gray-800 dark:text-indigo-400">
                                <FileText className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                                    {currentFileName || 'certificate.pdf'}
                                </p>
                                <p className="text-[10px] font-medium text-gray-400">
                                    {fileSizeFormatted ? `${fileSizeFormatted} · ` : ''}
                                    {currentFileName?.toLowerCase().endsWith('.pdf')
                                        ? 'PDF Document'
                                        : 'Image Document'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {cert.file_url && (
                                <a
                                    href={cert.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>{t('teacher.view_certificate') || 'View'}</span>
                                </a>
                            )}
                            {!readOnly && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                        {t('auth.replace_file', 'Replace')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Dropzone when no file selected */
                    !readOnly && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="group flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-4 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/30 dark:border-gray-700 dark:bg-gray-800/30"
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-400 shadow-2xs group-hover:text-indigo-600 dark:bg-gray-800 dark:group-hover:text-indigo-400">
                                <Upload className="h-4 w-4" />
                            </span>
                            <div className="text-left">
                                <p className="text-xs font-bold text-gray-700 group-hover:text-indigo-600 dark:text-gray-300 dark:group-hover:text-indigo-400">
                                    {t(
                                        'auth.drop_cert_file',
                                        'Drop your certificate here or browse',
                                    )}
                                </p>
                                <p className="text-[10px] font-medium text-gray-400">
                                    {t(
                                        'auth.drop_cert_hint',
                                        'PDF, JPG, or PNG · up to 10 MB',
                                    )}
                                </p>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
