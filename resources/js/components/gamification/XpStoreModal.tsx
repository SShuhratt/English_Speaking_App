import React, { useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { router } from '@inertiajs/react';
import {
    X,
    Sparkles,
    Shield,
    Ticket,
    Check,
    Copy,
    Award,
    AlertCircle,
    Loader2,
} from 'lucide-react';

export interface XpStoreItem {
    key: string;
    title_key: string;
    default_title: string;
    desc_key: string;
    default_desc: string;
    cost_xp: number;
    icon: string;
    can_afford: boolean;
    discount_percent?: number;
}

export interface DiscountVoucher {
    id: string;
    voucher_code: string;
    discount_percent: number;
    xp_spent: number;
    is_redeemed: boolean;
    redeemed_at?: string | null;
    created_at?: string;
}

export interface XpStoreCatalog {
    available_xp: number;
    total_xp: number;
    spent_xp: number;
    items: XpStoreItem[];
    active_vouchers: DiscountVoucher[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    catalog?: XpStoreCatalog;
    onRedeemed?: () => void;
}

export default function XpStoreModal({ isOpen, onClose, catalog, onRedeemed }: Props) {
    const { t } = useTranslation();
    const [submittingKey, setSubmittingKey] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [localCatalog, setLocalCatalog] = useState<XpStoreCatalog | undefined>(catalog);

    // Sync catalog when prop updates
    React.useEffect(() => {
        if (catalog) {
            setLocalCatalog(catalog);
        }
    }, [catalog]);

    if (!isOpen) return null;

    const availableXp = localCatalog?.available_xp ?? 0;
    const totalXp = localCatalog?.total_xp ?? 0;
    const items = localCatalog?.items ?? [];
    const vouchers = localCatalog?.active_vouchers ?? [];

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2500);
    };

    const handleRedeem = async (item: XpStoreItem) => {
        if (availableXp < item.cost_xp || submittingKey) {
            return;
        }

        setErrorMsg(null);
        setSuccessMsg(null);
        setSubmittingKey(item.key);

        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

            const res = await fetch('/gamification/store/redeem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ item_key: item.key }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setErrorMsg(data.message || t('gamification.insufficient_xp', 'Insufficient XP balance'));
                setSubmittingKey(null);
                return;
            }

            setSuccessMsg(data.message || t('gamification.redeem_success', 'Reward redeemed successfully!'));

            // Optimistically update localCatalog
            if (localCatalog) {
                const newAvailable = data.new_available_xp ?? Math.max(0, availableXp - item.cost_xp);
                const updatedItems = localCatalog.items.map((i) => ({
                    ...i,
                    can_afford: newAvailable >= i.cost_xp,
                }));
                const updatedVouchers = data.voucher
                    ? [data.voucher, ...localCatalog.active_vouchers]
                    : localCatalog.active_vouchers;

                setLocalCatalog({
                    ...localCatalog,
                    available_xp: newAvailable,
                    spent_xp: localCatalog.spent_xp + item.cost_xp,
                    items: updatedItems,
                    active_vouchers: updatedVouchers,
                });
            }

            if (onRedeemed) {
                onRedeemed();
            }

            // Refresh Inertia page in background to sync backend props
            router.reload({ only: ['gamification'] });
        } catch {
            setErrorMsg(t('gamification.insufficient_xp', 'Network error. Please try again.'));
        } finally {
            setSubmittingKey(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 md:p-8 shadow-2xl ring-1 ring-slate-900/10">
                {/* Header */}
                <div className="flex items-start justify-between pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                {t('gamification.store_title', 'XP Rewards Store')}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500">
                                {t(
                                    'gamification.store_subtitle',
                                    'Turn your practice XP into valuable rewards and lesson discounts'
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Balance Status Banner */}
                <div className="my-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 p-4 border border-amber-200/60 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                            {t('gamification.available_xp_label', 'Available XP')}
                        </span>
                        <div className="text-2xl font-black text-amber-900 flex items-center gap-1.5 mt-0.5">
                            <span>✨ {availableXp.toLocaleString()}</span>
                            <span className="text-xs font-medium text-amber-700">XP</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-medium text-slate-500">
                            {t('gamification.total_xp_label', 'Lifetime XP')}
                        </span>
                        <div className="text-sm font-semibold text-slate-700">
                            {totalXp.toLocaleString()} XP
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                {errorMsg && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 border border-emerald-200">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{successMsg}</span>
                    </div>
                )}

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-2">
                    {items.map((item) => {
                        const canAfford = availableXp >= item.cost_xp;
                        const isSubmitting = submittingKey === item.key;

                        return (
                            <div
                                key={item.key}
                                className={`flex flex-col justify-between rounded-2xl p-5 border transition-all ${
                                    canAfford
                                        ? 'border-indigo-100 bg-gradient-to-b from-white to-slate-50/70 hover:shadow-md hover:border-indigo-200'
                                        : 'border-slate-200/80 bg-slate-50/50 opacity-75'
                                }`}
                            >
                                <div>
                                    <div className="text-3xl mb-2">{item.icon}</div>
                                    <h3 className="font-bold text-slate-900 text-sm">
                                        {t(item.title_key, item.default_title)}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                        {t(item.desc_key, item.default_desc)}
                                    </p>
                                </div>

                                <div className="mt-5 pt-3 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-slate-600">Cost</span>
                                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                            {item.cost_xp} XP
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleRedeem(item)}
                                        disabled={!canAfford || !!submittingKey}
                                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                            canAfford
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:scale-95'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                <span>...</span>
                                            </>
                                        ) : canAfford ? (
                                            <span>
                                                {t('gamification.redeem_btn', { xp: String(item.cost_xp) })}
                                            </span>
                                        ) : (
                                            <span>{item.cost_xp} XP</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* My Vouchers Section */}
                <div className="mt-7 pt-5 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                        <Ticket className="h-4 w-4 text-indigo-600" />
                        <span>{t('gamification.my_vouchers_title', 'My Discount Vouchers')}</span>
                    </h4>

                    {vouchers.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">
                            {t('gamification.no_vouchers', 'No discount vouchers yet. Redeem your XP above!')}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {vouchers.map((voucher) => (
                                <div
                                    key={voucher.id}
                                    className={`flex items-center justify-between rounded-xl p-3 border text-xs ${
                                        voucher.is_redeemed
                                            ? 'bg-slate-50 border-slate-200 text-slate-400'
                                            : 'bg-indigo-50/50 border-indigo-200/80 text-indigo-950 font-medium'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="px-2 py-0.5 rounded-md font-black bg-indigo-600 text-white text-[11px]">
                                            {voucher.discount_percent}% OFF
                                        </span>
                                        <code className="font-mono font-bold tracking-wider text-slate-800">
                                            {voucher.voucher_code}
                                        </code>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {voucher.is_redeemed ? (
                                            <span className="text-[11px] text-slate-400">
                                                {t('gamification.redeemed_badge', 'Redeemed')}
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleCopy(voucher.voucher_code)}
                                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold transition"
                                            >
                                                {copiedCode === voucher.voucher_code ? (
                                                    <>
                                                        <Check className="h-3 w-3 text-emerald-600" />
                                                        <span>{t('gamification.copied', 'Copied!')}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3 w-3" />
                                                        <span>{t('gamification.copy_code', 'Copy Code')}</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
