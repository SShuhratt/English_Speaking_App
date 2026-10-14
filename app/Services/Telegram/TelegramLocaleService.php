<?php

namespace App\Services\Telegram;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

class TelegramLocaleService
{
    public const SUPPORTED_LOCALES = ['uz', 'ru', 'en'];

    public const DEFAULT_LOCALE = 'uz';

    /**
     * Resolve user or chat locale.
     */
    public function resolveLocale(?User $user, ?string $chatId = null, ?string $tgLangCode = null): string
    {
        if ($user && ! empty($user->telegram_locale) && in_array($user->telegram_locale, self::SUPPORTED_LOCALES, true)) {
            return $user->telegram_locale;
        }

        if ($chatId) {
            $cached = Cache::get("telegram_chat_locale:{$chatId}");
            if ($cached && in_array($cached, self::SUPPORTED_LOCALES, true)) {
                return $cached;
            }
        }

        if ($tgLangCode) {
            $code = strtolower(substr(trim($tgLangCode), 0, 2));
            if (in_array($code, self::SUPPORTED_LOCALES, true)) {
                return $code;
            }
        }

        return self::DEFAULT_LOCALE;
    }

    /**
     * Set and persist locale for a user and/or chat.
     */
    public function setLocale(string $locale, ?User $user = null, ?string $chatId = null): string
    {
        $normalized = strtolower(trim($locale));
        if (! in_array($normalized, self::SUPPORTED_LOCALES, true)) {
            $normalized = self::DEFAULT_LOCALE;
        }

        if ($user) {
            $user->update(['telegram_locale' => $normalized]);
        }

        if ($chatId) {
            Cache::put("telegram_chat_locale:{$chatId}", $normalized, now()->addDays(90));
        }

        return $normalized;
    }

    /**
     * Return language selection inline keyboard.
     */
    public function getLanguageInlineKeyboard(): array
    {
        return [
            'inline_keyboard' => [
                [
                    ['text' => '🇺🇿 O\'zbekcha', 'callback_data' => 'set_lang:uz'],
                    ['text' => '🇷🇺 Русский', 'callback_data' => 'set_lang:ru'],
                    ['text' => '🇬🇧 English', 'callback_data' => 'set_lang:en'],
                ],
            ],
        ];
    }

    /**
     * Get localized welcome prompt for direct bot start.
     */
    public function getWelcomePrompt(string $signedUrl, string $locale): array
    {
        $text = match ($locale) {
            'ru' => "👋 <b>Добро пожаловать в ConvoMate!</b>\n\n".
                "Чтобы подключить этот Telegram-чат к вашему аккаунту и мгновенно получать уведомления об уроках:\n\n".
                "1️⃣ <b>Быстрый способ:</b> Нажмите кнопку ниже для привязки через браузер.\n".
                '2️⃣ <b>Или:</b> Отправьте сюда <b>6-значный код</b> из настроек вашего профиля на сайте.',
            'en' => "👋 <b>Welcome to ConvoMate!</b>\n\n".
                "To connect this Telegram chat to your account and receive instant lesson alerts:\n\n".
                "1️⃣ <b>Fastest:</b> Tap the button below to link directly with your browser session.\n".
                '2️⃣ <b>Or:</b> Reply to this message with your <b>6-digit code</b> from your website profile settings.',
            default => "👋 <b>ConvoMate platformasiga xush kelibsiz!</b>\n\n".
                "Ushbu Telegram chatni akkauntingizga ulash va dars bildirishnomalarini shu yerda olish uchun:\n\n".
                "1️⃣ <b>Tezkor usul:</b> Quyidagi tugmani bosib brauzer orqali profilingizni ulang.\n".
                '2️⃣ <b>Yoki:</b> Saytdagi profilingiz sozlamalaridan olingan <b>6 xonali kodni</b> shu yerga yuboring.',
        };

        $buttonText = match ($locale) {
            'ru' => '🔗 Подключить аккаунт',
            'en' => '🔗 Link My Account',
            default => '🔗 Akkauntni ulash',
        };

        return [
            'text' => $text,
            'reply_markup' => [
                'inline_keyboard' => [
                    [['text' => $buttonText, 'url' => $signedUrl]],
                    [
                        ['text' => '🌐 Tilni o\'zgartirish / Сменить язык', 'callback_data' => 'choose_lang'],
                    ],
                ],
            ],
        ];
    }

    /**
     * Get localized link success message.
     */
    public function getLinkSuccessMessage(string $fullName, string $locale): string
    {
        return match ($locale) {
            'ru' => "✅ <b>Аккаунт успешно подключен!</b>\n\n".
                "Добро пожаловать, <b>{$fullName}</b>! Теперь вы будете получать уведомления о бронированиях, напоминания об уроках и ссылки на встречи прямо здесь.",
            'en' => "✅ <b>Account Linked Successfully!</b>\n\n".
                "Welcome, <b>{$fullName}</b>! You will now receive instant notifications about your booking requests, approvals, and lesson reminders here.",
            default => "✅ <b>Akkaunt muvaffaqiyatli ulandi!</b>\n\n".
                "Xush kelibsiz, <b>{$fullName}</b>! Endi dars buyurtmalari, eslatmalar va dars xonasi havolalari avtomatik ravishda shu yerga yuboriladi.",
        };
    }

    /**
     * Get localized link expired message.
     */
    public function getLinkExpiredMessage(string $locale): string
    {
        return match ($locale) {
            'ru' => "⚠️ <b>Срок действия этой ссылки истек или она недействительна.</b>\n\n".
                'Пожалуйста, перейдите в настройки профиля на сайте, чтобы создать новую ссылку или 6-значный код.',
            'en' => "⚠️ <b>This connection link has expired or is invalid.</b>\n\n".
                'Please visit your profile settings on the website to generate a new link or a 6-digit pairing code.',
            default => "⚠️ <b>Ushbu ulanish havolasining muddati tugagan yoki yaroqsiz.</b>\n\n".
                'Iltimos, yangi havola yoki 6 xonali ulanish kodini olish uchun saytdagi profil sozlamalariga kiring.',
        };
    }

    /**
     * Get localized already connected message.
     */
    public function getAlreadyConnectedMessage(string $fullName, string $locale): string
    {
        return match ($locale) {
            'ru' => "👋 Здравствуйте, <b>{$fullName}</b>!\n\n".
                'Ваш Telegram-аккаунт уже подключен к ConvoMate. Все уведомления об уроках приходят прямо сюда.',
            'en' => "👋 Hello, <b>{$fullName}</b>!\n\n".
                'Your Telegram account is already connected to ConvoMate. You will receive real-time lesson alerts right here.',
            default => "👋 Salom, <b>{$fullName}</b>!\n\n".
                'Sizning Telegram hisobingiz allaqachon ConvoMate tizimiga ulangan. Dars bildirishnomalari shu yerga yuboriladi.',
        };
    }

    /**
     * Get localized invalid code message.
     */
    public function getInvalidCodeMessage(string $locale): string
    {
        return match ($locale) {
            'ru' => "⚠️ <b>Неверный или просроченный код.</b>\n\n".
                'Введенный 6-значный код недействителен. Пожалуйста, откройте настройки профиля на сайте и сгенерируйте новый код.',
            'en' => "⚠️ <b>Invalid or expired code.</b>\n\n".
                'The 6-digit code you entered could not be verified. Please visit your profile settings on the website to generate a fresh pairing code.',
            default => "⚠️ <b>Kod yaroqsiz yoki muddati tugagan.</b>\n\n".
                'Kiritilgan 6 xonali kod tasdiqlanmadi. Iltimos, saytdagi profilingizdan yangi kod oling.',
        };
    }

    /**
     * Get receipt confirmed message.
     */
    public function getReceiptConfirmedMessage(string $locale): string
    {
        return match ($locale) {
            'ru' => "✅ <b>Чек об оплате успешно подтвержден!</b>\n\n".
                'Урок внесен в расписание. Ссылка на занятие будет отправлена вам прямо сюда перед началом.',
            'en' => "✅ <b>Payment receipt verified successfully!</b>\n\n".
                'Your lesson is confirmed and scheduled. The session link will be sent right here before class starts.',
            default => "✅ <b>To'lov cheki muvaffaqiyatli tasdiqlandi!</b>\n\n".
                'Dars jadvalga kiritildi. Dars boshlanishidan oldin havola shu yerda yuboriladi.',
        };
    }

    /**
     * Get receipt saved (awaiting bank transaction) message.
     */
    public function getReceiptSavedMessage(string $locale): string
    {
        return match ($locale) {
            'ru' => "⏳ <b>Чек принят!</b>\n\n".
                'Как только поступит подтверждение транзакции от банка, ваш урок активируется автоматически.',
            'en' => "⏳ <b>Receipt received!</b>\n\n".
                'As soon as bank transaction notification arrives, your lesson will be automatically activated.',
            default => "⏳ <b>Chek qabul qilindi!</b>\n\n".
                "Bankdan to'lov tasdig'i kelishi bilanoq darsingiz avtomatik faollashtiriladi.",
        };
    }

    /**
     * Get no pending booking message.
     */
    public function getReceiptNoPendingBookingMessage(string $locale): string
    {
        return match ($locale) {
            'ru' => "ℹ️ <b>Заказ не найден.</b>\n\n".
                'У вас нет активного урока или пакета, ожидающего подтверждения на данную сумму.',
            'en' => "ℹ️ <b>No pending order found.</b>\n\n".
                'You have no pending booking or package waiting for payment verification matching this amount.',
            default => "ℹ️ <b>Buyurtma topilmadi.</b>\n\n".
                'Sizda ushbu summaga mos tasdiqlash kutilayotgan dars yoki paket mavjud emas.',
        };
    }

    /**
     * Get unrecognized receipt message.
     */
    public function getReceiptUnrecognizedMessage(string $locale): string
    {
        return match ($locale) {
            'ru' => "⚠️ <b>Не удалось распознать чек.</b>\n\n".
                'Пожалуйста, отправьте четкий скриншот или PDF-файл квитанции, где видны сумма, дата и номер карты.',
            'en' => "⚠️ <b>Could not recognize receipt.</b>\n\n".
                'Please send a clear, full screenshot or receipt PDF file showing the amount, date, and recipient card.',
            default => "⚠️ <b>Chekni aniqlab bo'lmadi.</b>\n\n".
                "Iltimos, to'lov skrinshotini yoki chek faylini to'liq va aniq holda yuboring (summa, sana va karta ko'ringan bo'lishi lozim).",
        };
    }

    /**
     * Get prompt for unlinked user uploading a receipt.
     */
    public function getReceiptUnlinkedMessage(string $signedUrl, string $locale): array
    {
        $text = match ($locale) {
            'ru' => "⚠️ <b>Ваш аккаунт еще не подключен к ConvoMate.</b>\n\n".
                'Чтобы мы могли автоматически привязать ваш чек к уроку, пожалуйста, сначала подключите ваш аккаунт по кнопке ниже:',
            'en' => "⚠️ <b>Your Telegram account is not yet connected to ConvoMate.</b>\n\n".
                'To automatically match your receipt to your booked lesson, please link your account using the button below:',
            default => "⚠️ <b>Telegram hisobingiz hali ConvoMate platformasiga ulanmagan.</b>\n\n".
                'Yuborilgan chekni darsingizga avtomatik biriktirish uchun, iltimos, avval quyidagi tugma orqali akkauntingizni ulang:',
        };

        $btnText = match ($locale) {
            'ru' => '🔗 Подключить аккаунт',
            'en' => '🔗 Link My Account',
            default => '🔗 Akkauntni ulash',
        };

        return [
            'text' => $text,
            'reply_markup' => [
                'inline_keyboard' => [
                    [['text' => $btnText, 'url' => $signedUrl]],
                ],
            ],
        ];
    }

    /**
     * Get language switcher prompt.
     */
    public function getLanguagePrompt(string $locale): string
    {
        return match ($locale) {
            'ru' => '🌐 <b>Выберите язык / Tilni tanlang / Choose language:</b>',
            'en' => '🌐 <b>Choose your language / Tilni tanlang / Выберите язык:</b>',
            default => '🌐 <b>Tilni tanlang / Выберите язык / Choose language:</b>',
        };
    }

    /**
     * Get language changed confirmation message.
     */
    public function getLanguageChangedMessage(string $locale): string
    {
        return match ($locale) {
            'ru' => "🇷🇺 <b>Язык успешно изменен на русский!</b>\n\nВсе последующие сообщения будут отправляться на русском языке.",
            'en' => "🇬🇧 <b>Language successfully changed to English!</b>\n\nAll subsequent notifications will be sent in English.",
            default => "🇺🇿 <b>Til muvaffaqiyatli o'zbek tiliga o'zgartirildi!</b>\n\nBarcha keyingi xabarlar o'zbek tilida yuboriladi.",
        };
    }

    /**
     * Get localized payment dispatch payload.
     */
    public function getPaymentDispatchMessage(
        string $title,
        string $teacherName,
        int $amount,
        string $formattedCard,
        string $clickPayUrl,
        string $paymePayUrl,
        string $uzumPayUrl,
        string $locale
    ): array {
        $currency = match ($locale) {
            'ru' => 'сум',
            'en' => 'UZS',
            default => "so'm",
        };
        $formattedAmount = number_format($amount, 0, '', ' ');

        $text = match ($locale) {
            'ru' => "💳 <b>Реквизиты для оплаты: {$title}</b>\n\n".
                "👨‍🏫 <b>Преподаватель:</b> {$teacherName}\n".
                "💰 <b>Сумма к оплате:</b> {$formattedAmount} {$currency}\n".
                "💳 <b>Карта получателя:</b> <code>{$formattedCard}</code>\n\n".
                'Для оплаты нажмите на одно из приложений ниже. После перевода <b>отправьте чек или скриншот прямо в этот бот</b> — он будет проверен автоматически!',
            'en' => "💳 <b>Payment Details: {$title}</b>\n\n".
                "👨‍🏫 <b>Teacher:</b> {$teacherName}\n".
                "💰 <b>Amount:</b> {$formattedAmount} {$currency}\n".
                "💳 <b>Recipient Card:</b> <code>{$formattedCard}</code>\n\n".
                'Tap your preferred banking app below to pay. Once completed, <b>send your receipt or screenshot directly to this bot</b> for instant automated verification!',
            default => "💳 <b>To'lov ma'lumotlari: {$title}</b>\n\n".
                "👨‍🏫 <b>Ustoz:</b> {$teacherName}\n".
                "💰 <b>Summa:</b> {$formattedAmount} {$currency}\n".
                "💳 <b>Karta:</b> <code>{$formattedCard}</code>\n\n".
                "To'lov qilish uchun quyidagi ilovalardan birini bosing. To'lov amalga oshirilgach, chek yoki skrinshotni <b>shu botga yuboring</b> — u avtomatik tasdiqlanadi!",
        };

        $clickBtn = match ($locale) {
            'ru' => '🔵 Оплатить через Click',
            'en' => '🔵 Pay via Click',
            default => '🔵 Click orqali to\'lash',
        };

        $paymeBtn = match ($locale) {
            'ru' => '🟢 Оплатить через Payme',
            'en' => '🟢 Pay via Payme',
            default => '🟢 Payme orqali to\'lash',
        };

        $uzumBtn = match ($locale) {
            'ru' => '🟣 Оплатить через Uzum Bank',
            'en' => '🟣 Pay via Uzum Bank',
            default => '🟣 Uzum Bank orqali to\'lash',
        };

        return [
            'text' => $text,
            'reply_markup' => [
                'inline_keyboard' => [
                    [
                        ['text' => $clickBtn, 'url' => $clickPayUrl],
                        ['text' => $paymeBtn, 'url' => $paymePayUrl],
                    ],
                    [
                        ['text' => $uzumBtn, 'url' => $uzumPayUrl],
                    ],
                ],
            ],
        ];
    }

    /**
     * Get fallback account hello message.
     */
    public function getFallbackHelloMessage(string $fullName, string $locale): string
    {
        return match ($locale) {
            'ru' => "👋 Здравствуйте, <b>{$fullName}</b>! Ваш аккаунт подключен.\n\n".
                "Вы будете получать все уведомления о бронированиях, подтверждения и ссылки на уроки прямо сюда.\n\n".
                '💡 <i>Отправьте чек об оплате в этот чат, чтобы мгновенно подтвердить ваш урок. Для смены языка отправьте /lang</i>',
            'en' => "👋 Hello, <b>{$fullName}</b>! Your account is connected.\n\n".
                "You will receive all lesson requests, confirmations, and pre-session links automatically here.\n\n".
                '💡 <i>Send your payment receipt right here to verify your lesson instantly. To change language, type /lang</i>',
            default => "👋 Salom, <b>{$fullName}</b>! Sizning hisobingiz ulangan.\n\n".
                "Barcha dars so'rovlari, tasdiqlar va dars havolalari avtomatik shu yerga yuboriladi.\n\n".
                "💡 <i>Darsingizni darhol faollashtirish uchun to'lov chekini shu yerga yuborishingiz mumkin. Tilni o'zgartirish uchun /lang buyrug'ini yuboring.</i>",
        };
    }
}
