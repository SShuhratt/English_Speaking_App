<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

class CertificateValidationService
{
    /**
     * Exam scoring constraints matching frontend definitions.
     */
    public const EXAM_DEFINITIONS = [
        'ielts' => [
            'label' => 'IELTS',
            'overall' => ['min' => 0.0, 'max' => 9.0, 'step' => 0.5, 'example' => '7.5'],
            'skills' => [
                'listening' => ['min' => 0.0, 'max' => 9.0, 'step' => 0.5, 'example' => '8.0'],
                'reading' => ['min' => 0.0, 'max' => 9.0, 'step' => 0.5, 'example' => '8.0'],
                'writing' => ['min' => 0.0, 'max' => 9.0, 'step' => 0.5, 'example' => '7.0'],
                'speaking' => ['min' => 0.0, 'max' => 9.0, 'step' => 0.5, 'example' => '7.5'],
            ],
        ],
        'toefl' => [
            'label' => 'TOEFL iBT',
            'overall' => ['min' => 0.0, 'max' => 120.0, 'step' => 1.0, 'example' => '105'],
            'skills' => [
                'reading' => ['min' => 0.0, 'max' => 30.0, 'step' => 1.0, 'example' => '28'],
                'listening' => ['min' => 0.0, 'max' => 30.0, 'step' => 1.0, 'example' => '27'],
                'speaking' => ['min' => 0.0, 'max' => 30.0, 'step' => 1.0, 'example' => '26'],
                'writing' => ['min' => 0.0, 'max' => 30.0, 'step' => 1.0, 'example' => '24'],
            ],
        ],
        'duolingo' => [
            'label' => 'Duolingo (DET)',
            'overall' => ['min' => 10.0, 'max' => 160.0, 'step' => 5.0, 'example' => '135'],
            'skills' => [
                'literacy' => ['min' => 10.0, 'max' => 160.0, 'step' => 5.0, 'example' => '130'],
                'comprehension' => ['min' => 10.0, 'max' => 160.0, 'step' => 5.0, 'example' => '140'],
                'conversation' => ['min' => 10.0, 'max' => 160.0, 'step' => 5.0, 'example' => '135'],
                'production' => ['min' => 10.0, 'max' => 160.0, 'step' => 5.0, 'example' => '125'],
            ],
        ],
        'topik1' => [
            'label' => 'TOPIK I',
            'overall' => ['min' => 0.0, 'max' => 200.0, 'step' => 1.0, 'example' => '160'],
            'skills' => [
                'listening' => ['min' => 0.0, 'max' => 100.0, 'step' => 1.0, 'example' => '80'],
                'reading' => ['min' => 0.0, 'max' => 100.0, 'step' => 1.0, 'example' => '80'],
            ],
        ],
        'topik2' => [
            'label' => 'TOPIK II',
            'overall' => ['min' => 0.0, 'max' => 300.0, 'step' => 1.0, 'example' => '210'],
            'skills' => [
                'listening' => ['min' => 0.0, 'max' => 100.0, 'step' => 1.0, 'example' => '72'],
                'reading' => ['min' => 0.0, 'max' => 100.0, 'step' => 1.0, 'example' => '70'],
                'writing' => ['min' => 0.0, 'max' => 100.0, 'step' => 1.0, 'example' => '68'],
            ],
        ],
        'jlpt' => [
            'label' => 'JLPT',
            'overall' => ['min' => 0.0, 'max' => 180.0, 'step' => 1.0, 'example' => '135'],
            'skills' => [
                'language_knowledge' => ['min' => 0.0, 'max' => 60.0, 'step' => 1.0, 'example' => '45'],
                'reading' => ['min' => 0.0, 'max' => 60.0, 'step' => 1.0, 'example' => '45'],
                'listening' => ['min' => 0.0, 'max' => 60.0, 'step' => 1.0, 'example' => '45'],
            ],
        ],
        'goethe' => [
            'label' => 'Goethe-Zertifikat',
            'overall' => ['min' => 0.0, 'max' => 100.0, 'step' => 1.0, 'example' => '85'],
            'skills' => [
                'reading' => ['min' => 0.0, 'max' => 100.0, 'step' => 1.0, 'example' => '88'],
                'listening' => ['min' => 0.0, 'max' => 100.0, 'step' => 1.0, 'example' => '82'],
                'writing' => ['min' => 0.0, 'max' => 100.0, 'step' => 1.0, 'example' => '84'],
                'speaking' => ['min' => 0.0, 'max' => 100.0, 'step' => 1.0, 'example' => '86'],
            ],
        ],
        'delf_dalf' => [
            'label' => 'DELF / DALF',
            'overall' => ['min' => 0.0, 'max' => 100.0, 'step' => 0.5, 'example' => '78.5'],
            'skills' => [
                'listening' => ['min' => 0.0, 'max' => 25.0, 'step' => 0.5, 'example' => '20.0'],
                'reading' => ['min' => 0.0, 'max' => 25.0, 'step' => 0.5, 'example' => '21.5'],
                'writing' => ['min' => 0.0, 'max' => 25.0, 'step' => 0.5, 'example' => '18.0'],
                'speaking' => ['min' => 0.0, 'max' => 25.0, 'step' => 0.5, 'example' => '19.0'],
            ],
        ],
    ];

    /**
     * Validate a single score against exam constraints.
     */
    public static function validateScore(string $examType, string $skillKey, mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $typeKey = strtolower(trim($examType));
        if (! isset(self::EXAM_DEFINITIONS[$typeKey])) {
            return null;
        }

        $def = self::EXAM_DEFINITIONS[$typeKey];
        $rule = null;

        if ($skillKey === 'overall') {
            $rule = $def['overall'] ?? null;
        } else {
            $rule = $def['skills'][$skillKey] ?? null;
        }

        if (! $rule) {
            return null;
        }

        $trimmed = trim((string) $value);
        if ($trimmed === '') {
            return null;
        }

        $examLabel = $def['label'];
        $skillLabel = __('certificates.skills.'.$skillKey);
        if ($skillLabel === 'certificates.skills.'.$skillKey) {
            $skillLabel = ucfirst(str_replace('_', ' ', $skillKey));
        }

        if (is_numeric($trimmed)) {
            $numVal = (float) $trimmed;
        } elseif (preg_match('/\((\d+(?:\.\d+)?)\)/', $trimmed, $matches)) {
            $numVal = (float) $matches[1];
        } elseif (preg_match('/^level\s*[1-6]$/i', $trimmed)) {
            return null;
        } else {
            return __('certificates.score_must_be_numeric', [
                'exam' => $examLabel,
                'skill' => $skillLabel,
            ]);
        }
        $min = (float) $rule['min'];
        $max = (float) $rule['max'];
        $step = (float) ($rule['step'] ?? 1.0);

        if ($numVal < $min) {
            return __('certificates.score_min_exceeded', [
                'exam' => $examLabel,
                'skill' => $skillLabel,
                'min' => $min == (int) $min ? (int) $min : number_format($min, 1),
            ]);
        }

        if ($numVal > $max) {
            return __('certificates.score_max_exceeded', [
                'exam' => $examLabel,
                'skill' => $skillLabel,
                'max' => $max == (int) $max ? (int) $max : number_format($max, 1),
            ]);
        }

        // Step validation
        if ($step > 0) {
            $stepCheck = false;
            if (abs($step - 0.5) < 0.001) {
                $doubled = $numVal * 2.0;
                $stepCheck = abs(round($doubled) - $doubled) < 0.0001;
            } elseif (abs($step - 1.0) < 0.001) {
                $stepCheck = abs(round($numVal) - $numVal) < 0.0001;
            } elseif (abs($step - 5.0) < 0.001) {
                $divided = $numVal / 5.0;
                $stepCheck = abs(round($divided) - $divided) < 0.0001;
            } else {
                $divided = $numVal / $step;
                $stepCheck = abs(round($divided) - $divided) < 0.0001;
            }

            if (! $stepCheck) {
                return __('certificates.score_step_invalid', [
                    'exam' => $examLabel,
                    'skill' => $skillLabel,
                    'step' => $step == (int) $step ? (int) $step : number_format($step, 1),
                    'example' => $rule['example'] ?? '7.5',
                ]);
            }
        }

        return null;
    }

    /**
     * Validate all scores of a certificate item.
     *
     * @param  array<string, mixed>  $cert
     * @return array<string, string>
     */
    public static function validateCertificate(array $cert, int $certIndex = 0): array
    {
        $type = $cert['type'] ?? 'ielts';
        $errors = [];

        // 1. Overall score
        if (isset($cert['overall'])) {
            $err = self::validateScore($type, 'overall', $cert['overall']);
            if ($err) {
                $errors["certificates.{$certIndex}.overall"] = $err;
            }
        }

        // 2. Standard skills
        $skills = ['listening', 'reading', 'writing', 'speaking'];
        foreach ($skills as $skill) {
            if (isset($cert[$skill])) {
                $err = self::validateScore($type, $skill, $cert[$skill]);
                if ($err) {
                    $errors["certificates.{$certIndex}.{$skill}"] = $err;
                }
            }
        }

        // 3. Sub scores (for DET, JLPT, TOPIK, etc.)
        if (isset($cert['sub_scores']) && is_array($cert['sub_scores'])) {
            foreach ($cert['sub_scores'] as $subKey => $subVal) {
                $err = self::validateScore($type, $subKey, $subVal);
                if ($err) {
                    $errors["certificates.{$certIndex}.sub_scores.{$subKey}"] = $err;
                }
            }
        }

        return $errors;
    }

    /**
     * Validate an array of certificates and return all errors.
     *
     * @param  array<int, mixed>  $certificates
     * @return array<string, string>
     */
    public static function validateCertificatesList(array $certificates): array
    {
        $allErrors = [];

        foreach ($certificates as $index => $cert) {
            if (! is_array($cert)) {
                continue;
            }
            $errors = self::validateCertificate($cert, (int) $index);
            if (! empty($errors)) {
                $allErrors = array_merge($allErrors, $errors);
            }
        }

        return $allErrors;
    }

    /**
     * Validate certificates list and throw ValidationException if invalid.
     *
     * @param  array<int, mixed>  $certificates
     *
     * @throws ValidationException
     */
    public static function assertValidCertificates(array $certificates): void
    {
        $errors = self::validateCertificatesList($certificates);

        if (! empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }
}
