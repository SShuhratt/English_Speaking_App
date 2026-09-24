export interface CertificateSkillDefinition {
    key: string;
    labelKey: string;
    fallbackLabel: string;
    min?: number;
    max?: number;
    step?: number | string;
    placeholder: string;
    hint: string;
}

export interface CertificateTypeDefinition {
    id: string;
    label: string;
    language: string;
    languageBadgeKey: string;
    fallbackLanguageBadge: string;
    requiresCustomLanguage?: boolean;
    requiresCustomName?: boolean;
    overall: {
        labelKey: string;
        fallbackLabel: string;
        min?: number;
        max?: number;
        step?: number | string;
        placeholder: string;
        hint: string;
        options?: { value: string; label: string }[];
    };
    skills: CertificateSkillDefinition[];
}

export const CERTIFICATE_DEFINITIONS: CertificateTypeDefinition[] = [
    {
        id: 'ielts',
        label: 'IELTS',
        language: 'English',
        languageBadgeKey: 'auth.lang_english',
        fallbackLanguageBadge: 'English',
        overall: {
            labelKey: 'auth.score_overall',
            fallbackLabel: 'Overall Band',
            min: 0,
            max: 9,
            step: 0.5,
            placeholder: '7.5',
            hint: '0–9 · step 0.5',
        },
        skills: [
            {
                key: 'listening',
                labelKey: 'auth.score_listening',
                fallbackLabel: 'Listening',
                min: 0,
                max: 9,
                step: 0.5,
                placeholder: '8.0',
                hint: '0–9 · step 0.5',
            },
            {
                key: 'reading',
                labelKey: 'auth.score_reading',
                fallbackLabel: 'Reading',
                min: 0,
                max: 9,
                step: 0.5,
                placeholder: '8.0',
                hint: '0–9 · step 0.5',
            },
            {
                key: 'writing',
                labelKey: 'auth.score_writing',
                fallbackLabel: 'Writing',
                min: 0,
                max: 9,
                step: 0.5,
                placeholder: '7.0',
                hint: '0–9 · step 0.5',
            },
            {
                key: 'speaking',
                labelKey: 'auth.score_speaking',
                fallbackLabel: 'Speaking',
                min: 0,
                max: 9,
                step: 0.5,
                placeholder: '7.5',
                hint: '0–9 · step 0.5',
            },
        ],
    },
    {
        id: 'toefl',
        label: 'TOEFL iBT',
        language: 'English',
        languageBadgeKey: 'auth.lang_english',
        fallbackLanguageBadge: 'English',
        overall: {
            labelKey: 'auth.score_overall_toefl',
            fallbackLabel: 'Total Score',
            min: 0,
            max: 120,
            step: 1,
            placeholder: '105',
            hint: '0–120',
        },
        skills: [
            {
                key: 'reading',
                labelKey: 'auth.score_reading',
                fallbackLabel: 'Reading',
                min: 0,
                max: 30,
                step: 1,
                placeholder: '28',
                hint: '0–30',
            },
            {
                key: 'listening',
                labelKey: 'auth.score_listening',
                fallbackLabel: 'Listening',
                min: 0,
                max: 30,
                step: 1,
                placeholder: '27',
                hint: '0–30',
            },
            {
                key: 'speaking',
                labelKey: 'auth.score_speaking',
                fallbackLabel: 'Speaking',
                min: 0,
                max: 30,
                step: 1,
                placeholder: '26',
                hint: '0–30',
            },
            {
                key: 'writing',
                labelKey: 'auth.score_writing',
                fallbackLabel: 'Writing',
                min: 0,
                max: 30,
                step: 1,
                placeholder: '24',
                hint: '0–30',
            },
        ],
    },
    {
        id: 'duolingo',
        label: 'Duolingo (DET)',
        language: 'English',
        languageBadgeKey: 'auth.lang_english',
        fallbackLanguageBadge: 'English',
        overall: {
            labelKey: 'auth.score_overall_det',
            fallbackLabel: 'Overall Score',
            min: 10,
            max: 160,
            step: 5,
            placeholder: '135',
            hint: '10–160 · step 5',
        },
        skills: [
            {
                key: 'literacy',
                labelKey: 'auth.score_literacy',
                fallbackLabel: 'Literacy',
                min: 10,
                max: 160,
                step: 5,
                placeholder: '130',
                hint: '10–160',
            },
            {
                key: 'comprehension',
                labelKey: 'auth.score_comprehension',
                fallbackLabel: 'Comprehension',
                min: 10,
                max: 160,
                step: 5,
                placeholder: '140',
                hint: '10–160',
            },
            {
                key: 'conversation',
                labelKey: 'auth.score_conversation',
                fallbackLabel: 'Conversation',
                min: 10,
                max: 160,
                step: 5,
                placeholder: '135',
                hint: '10–160',
            },
            {
                key: 'production',
                labelKey: 'auth.score_production',
                fallbackLabel: 'Production',
                min: 10,
                max: 160,
                step: 5,
                placeholder: '125',
                hint: '10–160',
            },
        ],
    },
    {
        id: 'topik1',
        label: 'TOPIK I',
        language: 'Korean',
        languageBadgeKey: 'auth.lang_korean',
        fallbackLanguageBadge: 'Korean',
        overall: {
            labelKey: 'auth.score_overall_topik',
            fallbackLabel: 'Total Score',
            min: 0,
            max: 200,
            step: 1,
            placeholder: '160',
            hint: '0–200 (Level 1–2)',
        },
        skills: [
            {
                key: 'listening',
                labelKey: 'auth.score_listening',
                fallbackLabel: 'Listening',
                min: 0,
                max: 100,
                step: 1,
                placeholder: '80',
                hint: '0–100',
            },
            {
                key: 'reading',
                labelKey: 'auth.score_reading',
                fallbackLabel: 'Reading',
                min: 0,
                max: 100,
                step: 1,
                placeholder: '80',
                hint: '0–100',
            },
        ],
    },
    {
        id: 'topik2',
        label: 'TOPIK II',
        language: 'Korean',
        languageBadgeKey: 'auth.lang_korean',
        fallbackLanguageBadge: 'Korean',
        overall: {
            labelKey: 'auth.score_overall_topik',
            fallbackLabel: 'Total Score',
            min: 0,
            max: 300,
            step: 1,
            placeholder: '210',
            hint: '0–300 (Level 3–6)',
        },
        skills: [
            {
                key: 'listening',
                labelKey: 'auth.score_listening',
                fallbackLabel: 'Listening',
                min: 0,
                max: 100,
                step: 1,
                placeholder: '72',
                hint: '0–100',
            },
            {
                key: 'reading',
                labelKey: 'auth.score_reading',
                fallbackLabel: 'Reading',
                min: 0,
                max: 100,
                step: 1,
                placeholder: '70',
                hint: '0–100',
            },
            {
                key: 'writing',
                labelKey: 'auth.score_writing',
                fallbackLabel: 'Writing',
                min: 0,
                max: 100,
                step: 1,
                placeholder: '68',
                hint: '0–100',
            },
        ],
    },
    {
        id: 'jlpt',
        label: 'JLPT',
        language: 'Japanese',
        languageBadgeKey: 'auth.lang_japanese',
        fallbackLanguageBadge: 'Japanese',
        overall: {
            labelKey: 'auth.score_overall_jlpt',
            fallbackLabel: 'Total Score',
            min: 0,
            max: 180,
            step: 1,
            placeholder: '135',
            hint: '0–180 (N5–N1)',
        },
        skills: [
            {
                key: 'language_knowledge',
                labelKey: 'auth.score_language_knowledge',
                fallbackLabel: 'Language Knowledge',
                min: 0,
                max: 60,
                step: 1,
                placeholder: '45',
                hint: '0–60',
            },
            {
                key: 'reading',
                labelKey: 'auth.score_reading',
                fallbackLabel: 'Reading',
                min: 0,
                max: 60,
                step: 1,
                placeholder: '45',
                hint: '0–60',
            },
            {
                key: 'listening',
                labelKey: 'auth.score_listening',
                fallbackLabel: 'Listening',
                min: 0,
                max: 60,
                step: 1,
                placeholder: '45',
                hint: '0–60',
            },
        ],
    },
    {
        id: 'goethe',
        label: 'Goethe-Zertifikat',
        language: 'German',
        languageBadgeKey: 'auth.lang_german',
        fallbackLanguageBadge: 'German',
        overall: {
            labelKey: 'auth.score_overall_goethe',
            fallbackLabel: 'Total Points / Grade',
            min: 0,
            max: 100,
            step: 1,
            placeholder: '85',
            hint: '0–100 pts (A1–C2)',
        },
        skills: [
            {
                key: 'reading',
                labelKey: 'auth.score_reading_de',
                fallbackLabel: 'Lesen (Reading)',
                min: 0,
                max: 100,
                step: 1,
                placeholder: '88',
                hint: '0–100',
            },
            {
                key: 'listening',
                labelKey: 'auth.score_listening_de',
                fallbackLabel: 'Hören (Listening)',
                min: 0,
                max: 100,
                step: 1,
                placeholder: '82',
                hint: '0–100',
            },
            {
                key: 'writing',
                labelKey: 'auth.score_writing_de',
                fallbackLabel: 'Schreiben (Writing)',
                min: 0,
                max: 100,
                step: 1,
                placeholder: '84',
                hint: '0–100',
            },
            {
                key: 'speaking',
                labelKey: 'auth.score_speaking_de',
                fallbackLabel: 'Sprechen (Speaking)',
                min: 0,
                max: 100,
                step: 1,
                placeholder: '86',
                hint: '0–100',
            },
        ],
    },
    {
        id: 'testdaf',
        label: 'TestDaF',
        language: 'German',
        languageBadgeKey: 'auth.lang_german',
        fallbackLanguageBadge: 'German',
        overall: {
            labelKey: 'auth.score_overall_testdaf',
            fallbackLabel: 'Overall Result',
            placeholder: '4x TDN 4',
            hint: 'e.g. 4x TDN 4 or 4x TDN 5',
        },
        skills: [
            {
                key: 'reading',
                labelKey: 'auth.score_reading_testdaf',
                fallbackLabel: 'Leseverstehen',
                placeholder: 'TDN 4',
                hint: 'TDN 3–5 or pts',
            },
            {
                key: 'listening',
                labelKey: 'auth.score_listening_testdaf',
                fallbackLabel: 'Hörverstehen',
                placeholder: 'TDN 4',
                hint: 'TDN 3–5 or pts',
            },
            {
                key: 'writing',
                labelKey: 'auth.score_writing_testdaf',
                fallbackLabel: 'Schriftlicher Ausdruck',
                placeholder: 'TDN 4',
                hint: 'TDN 3–5 or pts',
            },
            {
                key: 'speaking',
                labelKey: 'auth.score_speaking_testdaf',
                fallbackLabel: 'Mündlicher Ausdruck',
                placeholder: 'TDN 5',
                hint: 'TDN 3–5 or pts',
            },
        ],
    },
    {
        id: 'delf_dalf',
        label: 'DELF / DALF',
        language: 'French',
        languageBadgeKey: 'auth.lang_french',
        fallbackLanguageBadge: 'French',
        overall: {
            labelKey: 'auth.score_overall_delf',
            fallbackLabel: 'Total Score',
            min: 0,
            max: 100,
            step: 0.5,
            placeholder: '78.5',
            hint: '0–100 pts (A1–C2)',
        },
        skills: [
            {
                key: 'listening',
                labelKey: 'auth.score_listening_fr',
                fallbackLabel: 'Compréhension orale',
                min: 0,
                max: 25,
                step: 0.5,
                placeholder: '20',
                hint: '0–25',
            },
            {
                key: 'reading',
                labelKey: 'auth.score_reading_fr',
                fallbackLabel: 'Compréhension écrite',
                min: 0,
                max: 25,
                step: 0.5,
                placeholder: '21.5',
                hint: '0–25',
            },
            {
                key: 'writing',
                labelKey: 'auth.score_writing_fr',
                fallbackLabel: 'Production écrite',
                min: 0,
                max: 25,
                step: 0.5,
                placeholder: '18',
                hint: '0–25',
            },
            {
                key: 'speaking',
                labelKey: 'auth.score_speaking_fr',
                fallbackLabel: 'Production orale',
                min: 0,
                max: 25,
                step: 0.5,
                placeholder: '19',
                hint: '0–25',
            },
        ],
    },
    {
        id: 'cefr',
        label: 'CEFR (A1 – C2)',
        language: 'Any Language',
        languageBadgeKey: 'auth.lang_cefr',
        fallbackLanguageBadge: 'CEFR',
        overall: {
            labelKey: 'auth.score_overall_cefr',
            fallbackLabel: 'CEFR Level',
            placeholder: 'C1',
            hint: 'A1, A2, B1, B2, C1, or C2',
            options: [
                { value: 'A1', label: 'A1 (Beginner)' },
                { value: 'A2', label: 'A2 (Elementary)' },
                { value: 'B1', label: 'B1 (Intermediate)' },
                { value: 'B2', label: 'B2 (Upper-Intermediate)' },
                { value: 'C1', label: 'C1 (Advanced)' },
                { value: 'C2', label: 'C2 (Mastery)' },
            ],
        },
        skills: [
            {
                key: 'listening',
                labelKey: 'auth.score_listening',
                fallbackLabel: 'Listening',
                placeholder: 'e.g. C1 or 65',
                hint: 'Level or score',
            },
            {
                key: 'reading',
                labelKey: 'auth.score_reading',
                fallbackLabel: 'Reading',
                placeholder: 'e.g. C1 or 68',
                hint: 'Level or score',
            },
            {
                key: 'writing',
                labelKey: 'auth.score_writing',
                fallbackLabel: 'Writing',
                placeholder: 'e.g. B2 or 58',
                hint: 'Level or score',
            },
            {
                key: 'speaking',
                labelKey: 'auth.score_speaking',
                fallbackLabel: 'Speaking',
                placeholder: 'e.g. C1 or 65',
                hint: 'Level or score',
            },
        ],
    },
    {
        id: 'other',
        label: 'Other Certificate',
        language: 'Other',
        languageBadgeKey: 'auth.lang_other',
        fallbackLanguageBadge: 'Other',
        requiresCustomName: true,
        overall: {
            labelKey: 'auth.score_overall_custom',
            fallbackLabel: 'Overall Grade / Score',
            placeholder: 'e.g. Distinction, 95%, Pass A',
            hint: 'Grade, band, or score',
        },
        skills: [],
    },
];

export function getCertificateDefinition(type?: string): CertificateTypeDefinition {
    const found = CERTIFICATE_DEFINITIONS.find((c) => c.id === type);
    return found || CERTIFICATE_DEFINITIONS[0]; // defaults to IELTS
}

export interface LanguageOption {
    id: string;
    label: string;
    labelKey: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
    { id: 'english', label: 'English', labelKey: 'lang.english' },
    { id: 'german', label: 'German', labelKey: 'lang.german' },
    { id: 'french', label: 'French', labelKey: 'lang.french' },
    { id: 'korean', label: 'Korean', labelKey: 'lang.korean' },
    { id: 'japanese', label: 'Japanese', labelKey: 'lang.japanese' },
    { id: 'spanish', label: 'Spanish', labelKey: 'lang.spanish' },
    { id: 'arabic', label: 'Arabic', labelKey: 'lang.arabic' },
    { id: 'chinese', label: 'Chinese', labelKey: 'lang.chinese' },
    { id: 'russian', label: 'Russian', labelKey: 'lang.russian' },
    { id: 'turkish', label: 'Turkish', labelKey: 'lang.turkish' },
    { id: 'italian', label: 'Italian', labelKey: 'lang.italian' },
    { id: 'other', label: 'Other Language', labelKey: 'lang.other' },
];

export function getAvailableExamsForLanguage(languageKey?: string): CertificateTypeDefinition[] {
    const lang = (languageKey || 'english').toLowerCase();

    const specificExamIdsByLang: Record<string, string[]> = {
        english: ['ielts', 'toefl', 'duolingo'],
        german: ['goethe', 'testdaf'],
        french: ['delf_dalf'],
        korean: ['topik1', 'topik2'],
        japanese: ['jlpt'],
    };

    const specificExamIds = specificExamIdsByLang[lang] || [];
    // Every language gets: specific exams + CEFR + Other
    const allowedExamIds = [...specificExamIds, 'cefr', 'other'];

    return CERTIFICATE_DEFINITIONS.filter((def) => allowedExamIds.includes(def.id));
}

export function getDefaultLanguageForExam(examKey?: string): string {
    switch (examKey) {
        case 'ielts':
        case 'toefl':
        case 'duolingo':
            return 'english';
        case 'goethe':
        case 'testdaf':
            return 'german';
        case 'delf_dalf':
            return 'french';
        case 'topik1':
        case 'topik2':
            return 'korean';
        case 'jlpt':
            return 'japanese';
        default:
            return 'english';
    }
}
