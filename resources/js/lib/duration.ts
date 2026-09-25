/**
 * Full-word duration and time unit formatting without short ambiguous symbols.
 */

/**
 * Format hours with full localized units.
 * Uzbek: "1 soat", "2 soat", "1.5 soat", "6 soat"
 * Russian: "1 час", "2 часа", "1.5 часа", "6 часов"
 * English: "1 hour", "2 hours", "1.5 hours"
 */
export function formatHours(hours: number, locale: string = 'en'): string {
    const isUz = locale === 'uz';
    const isRu = locale === 'ru';

    if (isUz) {
        return `${hours} soat`;
    }

    if (isRu) {
        if (!Number.isInteger(hours)) {
            return `${hours} часа`;
        }
        const rem10 = hours % 10;
        const rem100 = hours % 100;
        if (rem10 === 1 && rem100 !== 11) {
            return `${hours} час`;
        }
        if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 >= 20)) {
            return `${hours} часа`;
        }
        return `${hours} часов`;
    }

    return hours === 1 ? '1 hour' : `${hours} hours`;
}

/**
 * Format minutes with full localized units.
 * Uzbek: "30 daqiqa", "45 daqiqa"
 * Russian: "1 минута", "2 минуты", "30 минут"
 * English: "1 minute", "30 minutes"
 */
export function formatMinutes(minutes: number, locale: string = 'en'): string {
    const isUz = locale === 'uz';
    const isRu = locale === 'ru';

    if (isUz) {
        return `${minutes} daqiqa`;
    }

    if (isRu) {
        if (!Number.isInteger(minutes)) {
            return `${minutes} минуты`;
        }
        const rem10 = minutes % 10;
        const rem100 = minutes % 100;
        if (rem10 === 1 && rem100 !== 11) {
            return `${minutes} минута`;
        }
        if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 >= 20)) {
            return `${minutes} минуты`;
        }
        return `${minutes} минут`;
    }

    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}

/**
 * Format total minutes as a clean duration using full words.
 * Exact hours show just the hours (Option A).
 */
export function formatDuration(totalMinutes: number, locale: string = 'en'): string {
    if (totalMinutes <= 0) {
        return formatMinutes(0, locale);
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours > 0 && mins === 0) {
        return formatHours(hours, locale);
    }

    if (hours === 0) {
        return formatMinutes(mins, locale);
    }

    return `${formatHours(hours, locale)} ${formatMinutes(mins, locale)}`;
}

/**
 * Format rate unit (e.g. "so'm / soat" for UZ, "so'm / час" for RU, "so'm / hour" for EN).
 */
export function formatRateUnit(locale: string = 'en'): string {
    if (locale === 'uz') return "so'm / soat";
    if (locale === 'ru') return "so'm / час";
    return "so'm / hour";
}

/**
 * Format balance remaining (e.g. "120 daqiqa qoldiq" for UZ, "остаток 120 минут" for RU).
 */
export function formatRemainingBalance(minutes: number, locale: string = 'en'): string {
    if (locale === 'uz') {
        return `${formatDuration(minutes, locale)} qoldiq`;
    }
    if (locale === 'ru') {
        return `остаток: ${formatDuration(minutes, locale)}`;
    }
    return `${formatDuration(minutes, locale)} remaining`;
}
