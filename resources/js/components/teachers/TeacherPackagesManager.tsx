import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Package, Plus, Trash2, Edit2, Sparkles, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { toast } from 'sonner';
import axios from 'axios';

export interface TeacherPackageItem {
    id: string;
    teacher_id: string;
    title: string;
    total_hours: number;
    total_minutes: number;
    price: number;
    discount_percentage?: number | null;
    description?: string | null;
    is_active: boolean;
    created_at?: string;
}

interface Props {
    packages: TeacherPackageItem[];
    hourlyRate?: number;
}

export default function TeacherPackagesManager({ packages: initialPackages, hourlyRate = 0 }: Props) {
    const { t } = useTranslation();
    const [packagesList, setPackagesList] = useState<TeacherPackageItem[]>(initialPackages || []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<TeacherPackageItem | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => {
        if (initialPackages) {
            setPackagesList(initialPackages);
        }
    }, [initialPackages]);

    const [title, setTitle] = useState('');
    const [hours, setHours] = useState('5');
    const [price, setPrice] = useState('');
    const [discount, setDiscount] = useState<string>('');
    const [description, setDescription] = useState('');

    const formatNumberWithSpaces = (val: string) => {
        const digits = val.replace(/\D/g, '');
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    const openCreateModal = () => {
        setEditingPackage(null);
        setTitle(t('packages.hours_count', { count: 5 }));
        setHours('5');
        const regularTotal = hourlyRate * 5;
        const suggested = regularTotal > 0 ? Math.round((regularTotal * 0.9) / 1000) * 1000 : 0;
        setPrice(suggested > 0 ? formatNumberWithSpaces(suggested.toString()) : '');
        setDiscount(hourlyRate > 0 ? '10' : '');
        setDescription('');
        setIsModalOpen(true);
    };

    const openEditModal = (pkg: TeacherPackageItem) => {
        setEditingPackage(pkg);
        setTitle(pkg.title);
        setHours(pkg.total_hours.toString());
        setPrice(formatNumberWithSpaces(pkg.price.toString()));
        setDiscount(pkg.discount_percentage ? pkg.discount_percentage.toString() : '');
        setDescription(pkg.description || '');
        setIsModalOpen(true);
    };

    const handleHoursChange = (newHoursStr: string) => {
        setHours(newHoursStr);
        const parsedHours = parseInt(newHoursStr, 10);
        if (parsedHours > 0) {
            setTitle(t('packages.hours_count', { count: parsedHours }));
            if (hourlyRate > 0) {
                const regularTotal = hourlyRate * parsedHours;
                const disc = parseInt(discount, 10) || 0;
                const calculated = disc > 0
                    ? Math.round((regularTotal * (1 - disc / 100)) / 1000) * 1000
                    : regularTotal;
                setPrice(formatNumberWithSpaces(calculated.toString()));
            }
        }
    };

    const handleDiscountChange = (newDiscountStr: string) => {
        let clean = newDiscountStr.replace(/\D/g, '');
        if (clean !== '') {
            let num = parseInt(clean, 10);
            if (num > 99) num = 99;
            clean = num.toString();
        }
        setDiscount(clean);

        const parsedHours = parseInt(hours, 10) || 0;
        if (hourlyRate > 0 && parsedHours > 0) {
            const regularTotal = hourlyRate * parsedHours;
            const discNum = clean === '' ? 0 : parseInt(clean, 10);
            const calculated = discNum > 0
                ? Math.round((regularTotal * (1 - discNum / 100)) / 1000) * 1000
                : regularTotal;
            setPrice(formatNumberWithSpaces(calculated.toString()));
        }
    };

    const handlePriceChange = (newPriceStr: string) => {
        const digits = newPriceStr.replace(/\D/g, '');
        setPrice(formatNumberWithSpaces(digits));

        const parsedHours = parseInt(hours, 10) || 0;
        const numericPrice = parseInt(digits, 10) || 0;
        if (hourlyRate > 0 && parsedHours > 0 && numericPrice > 0) {
            const regularTotal = hourlyRate * parsedHours;
            if (numericPrice < regularTotal) {
                const calculatedDiscount = Math.round(((regularTotal - numericPrice) / regularTotal) * 100);
                setDiscount(Math.min(99, Math.max(1, calculatedDiscount)).toString());
            } else {
                setDiscount('0');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numericPrice = parseInt(price.replace(/\s+/g, ''), 10);
        const numericHours = parseInt(hours, 10);

        if (!numericHours || numericHours <= 0) {
            toast.error(t('packages.hours_validation'));
            return;
        }

        if (!numericPrice || numericPrice <= 0) {
            toast.error(t('packages.price_validation'));
            return;
        }

        // Client-side duplicate validation
        const cleanTitle = title.trim().toLowerCase();
        let effectiveDiscount = discount ? parseInt(discount, 10) : null;
        if (effectiveDiscount === null && hourlyRate > 0 && hourlyRate * numericHours > numericPrice) {
            effectiveDiscount = Math.round(((hourlyRate * numericHours - numericPrice) / (hourlyRate * numericHours)) * 100);
        }

        const otherPackages = packagesList.filter(
            (p) => !editingPackage || p.id !== editingPackage.id,
        );

        const hasDuplicateTitle = otherPackages.some(
            (p) => p.title.trim().toLowerCase() === cleanTitle,
        );
        if (hasDuplicateTitle) {
            toast.error(t('packages.error_duplicate_title'));
            return;
        }

        const hasDuplicateDurationDiscount = otherPackages.some(
            (p) =>
                p.total_hours === numericHours &&
                (p.discount_percentage ?? null) === effectiveDiscount,
        );
        if (hasDuplicateDurationDiscount) {
            toast.error(t('packages.error_duplicate_duration_discount'));
            return;
        }

        setSubmitting(true);
        try {
            if (editingPackage) {
                const res = await axios.put(`/teacher/packages/${editingPackage.id}`, {
                    title: title.trim(),
                    total_hours: numericHours,
                    price: numericPrice,
                    discount_percentage: discount ? parseInt(discount, 10) : null,
                    description,
                });
                const updated = res.data?.package;
                setPackagesList((prev) =>
                    prev.map((p) =>
                        p.id === editingPackage.id
                            ? updated || {
                                  ...p,
                                  title: title.trim(),
                                  total_hours: numericHours,
                                  total_minutes: numericHours * 60,
                                  price: numericPrice,
                                  discount_percentage: discount ? parseInt(discount, 10) : null,
                                  description,
                              }
                            : p,
                    ),
                );
                toast.success(t('packages.update_success'));
                router.reload({ only: ['packages'] });
            } else {
                const res = await axios.post('/teacher/packages', {
                    title: title.trim(),
                    total_hours: numericHours,
                    price: numericPrice,
                    discount_percentage: discount ? parseInt(discount, 10) : null,
                    description,
                });
                if (res.data?.package) {
                    setPackagesList((prev) => [...prev, res.data.package]);
                }
                toast.success(t('packages.create_success'));
                router.reload({ only: ['packages'] });
            }
            setIsModalOpen(false);
        } catch (error: any) {
            const fieldErrors = error.response?.data?.errors;
            if (fieldErrors?.title) {
                toast.error(t('packages.error_duplicate_title'));
            } else if (fieldErrors?.total_hours) {
                toast.error(t('packages.error_duplicate_duration_discount'));
            } else {
                const firstError = fieldErrors ? Object.values(fieldErrors).flat()[0] : null;
                const msg = (firstError as string) || error.response?.data?.message || t('packages.save_error');
                toast.error(msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggle = async (pkg: TeacherPackageItem) => {
        if (togglingId) return;
        setTogglingId(pkg.id);
        try {
            const res = await axios.post(`/teacher/packages/${pkg.id}/toggle`);
            const updatedActive = Boolean(res.data?.is_active);
            setPackagesList((prev) =>
                prev.map((p) =>
                    p.id === pkg.id ? { ...p, is_active: updatedActive } : p,
                ),
            );
            if (updatedActive) {
                toast.success(
                    t('packages.status_activated', { name: pkg.title }),
                );
            } else {
                toast.success(
                    t('packages.status_deactivated', { name: pkg.title }),
                );
            }
            router.reload({ only: ['packages'] });
        } catch (error: any) {
            toast.error(t('packages.status_update_error'));
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (pkg: TeacherPackageItem) => {
        if (!confirm(t('packages.delete_confirm'))) return;
        try {
            const res = await axios.delete(`/teacher/packages/${pkg.id}`);
            if (res.data?.deactivated) {
                setPackagesList((prev) =>
                    prev.map((p) => (p.id === pkg.id ? { ...p, is_active: false } : p)),
                );
            } else {
                setPackagesList((prev) => prev.filter((p) => p.id !== pkg.id));
            }
            toast.success(t('packages.delete_success'));
            router.reload({ only: ['packages'] });
        } catch (error: any) {
            toast.error(t('packages.delete_error'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        {t('packages.manage_title')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t('packages.manage_desc')}
                    </p>
                </div>
                <Button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    {t('packages.create_pack')}
                </Button>
            </div>

            {packagesList.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 text-center py-10">
                    <CardContent className="space-y-3">
                        <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Package className="h-6 w-6" />
                        </div>
                        <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                            {t('packages.no_packages')}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            {t('packages.empty_encourage')}
                        </p>
                        <Button
                            onClick={openCreateModal}
                            variant="outline"
                            className="mt-2 inline-flex items-center gap-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                        >
                            <Plus className="h-4 w-4" />
                            {t('packages.create_pack')}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {packagesList.map((pkg) => {
                        const regularTotal = hourlyRate * pkg.total_hours;
                        const savings = regularTotal > pkg.price ? regularTotal - pkg.price : 0;

                        return (
                            <Card
                                key={pkg.id}
                                className={`relative flex flex-col justify-between transition-all border shadow-sm hover:shadow-md ${
                                    pkg.is_active
                                        ? 'border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-gray-900'
                                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950/50 opacity-75'
                                }`}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                                                {pkg.title}
                                            </CardTitle>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge
                                                    variant="secondary"
                                                    className="font-medium text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/60"
                                                >
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    {pkg.total_hours} {t('packages.hours')}
                                                </Badge>
                                                {pkg.discount_percentage ? (
                                                    <Badge className="bg-emerald-600 text-white text-[11px] font-bold">
                                                        {t('packages.discount_badge', { discount: pkg.discount_percentage })}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </div>

                                        {pkg.is_active ? (
                                            <Badge
                                                variant="outline"
                                                className="border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-semibold"
                                            >
                                                {t('packages.status_active')}
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="border-gray-300 text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-[11px] font-semibold"
                                            >
                                                {t('packages.status_inactive')}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {pkg.description ? (
                                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                            {pkg.description}
                                        </p>
                                    ) : null}

                                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                {t('packages.price')}
                                            </span>
                                            <div className="text-right">
                                                <span className="text-lg font-black text-indigo-700 dark:text-indigo-400">
                                                    {pkg.price.toLocaleString('ru-RU').replace(/,/g, ' ')} {t('auth.currency_som')}
                                                </span>
                                                {regularTotal > pkg.price && (
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 line-through">
                                                        {regularTotal.toLocaleString('ru-RU').replace(/,/g, ' ')} {t('auth.currency_som')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {savings > 0 && (
                                            <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                                                <Sparkles className="h-3 w-3" />
                                                {t('packages.teacher_discount', { amount: `${savings.toLocaleString('ru-RU').replace(/,/g, ' ')} ${t('auth.currency_som')}` })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            disabled={togglingId === pkg.id}
                                            onClick={() => handleToggle(pkg)}
                                            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 disabled:opacity-50"
                                        >
                                            {pkg.is_active ? (
                                                <span className="flex items-center gap-1.5">
                                                    <ToggleRight className="h-4 w-4 text-emerald-600" />
                                                    {t('packages.status_active')}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5">
                                                    <ToggleLeft className="h-4 w-4 text-gray-400" />
                                                    {t('packages.status_inactive')}
                                                </span>
                                            )}
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => openEditModal(pkg)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-indigo-600"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(pkg)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-indigo-600" />
                            {editingPackage ? t('packages.edit_pack') : t('packages.create_pack')}
                        </DialogTitle>
                        <DialogDescription>
                            {editingPackage ? t('packages.modal_edit_desc') : t('packages.modal_create_desc')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        {/* Preset Hour Buttons and Custom Hours Input */}
                        <div>
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {t('packages.pack_hours')}
                            </Label>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                {['5', '10', '15', '20'].map((preset) => (
                                    <Button
                                        key={preset}
                                        type="button"
                                        size="sm"
                                        variant={hours === preset ? 'default' : 'outline'}
                                        onClick={() => handleHoursChange(preset)}
                                        className={hours === preset ? 'bg-indigo-600 text-white' : ''}
                                    >
                                        {preset} {t('packages.hours')}
                                    </Button>
                                ))}
                                <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                                    <span className="text-xs text-gray-500 font-medium">
                                        {t('packages.custom_hours')}:
                                    </span>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={hours}
                                        onChange={(e) => handleHoursChange(e.target.value)}
                                        className="w-20 h-8 text-center text-xs font-bold"
                                        placeholder="8"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Title input */}
                        <div>
                            <Label htmlFor="pkg-title" className="text-xs font-semibold">
                                {t('packages.pack_title')}
                            </Label>
                            <Input
                                id="pkg-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t('packages.pack_title_placeholder')}
                                className="mt-1"
                                required
                            />
                        </div>

                        {/* Price and Discount */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="pkg-price" className="text-xs font-semibold">
                                    {t('packages.pack_price')}
                                </Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="pkg-price"
                                        type="text"
                                        inputMode="numeric"
                                        value={price}
                                        onChange={(e) => handlePriceChange(e.target.value)}
                                        placeholder={t('packages.pack_price_placeholder')}
                                        className="pr-14"
                                        required
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">
                                        {t('auth.currency_som')}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="pkg-discount" className="text-xs font-semibold">
                                    {t('packages.discount_optional')}
                                </Label>
                                <Input
                                    id="pkg-discount"
                                    type="text"
                                    inputMode="numeric"
                                    value={discount}
                                    onChange={(e) => handleDiscountChange(e.target.value)}
                                    placeholder={t('packages.discount_placeholder')}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        {hourlyRate > 0 && (
                            <div className="rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 p-2.5 text-xs text-indigo-700 dark:text-indigo-300">
                                {t('packages.standard_rate_info', {
                                    rate: hourlyRate.toLocaleString('ru-RU').replace(/,/g, ' '),
                                    currency: t('auth.currency_som'),
                                    hours: hours || '0',
                                    total: (hourlyRate * (parseInt(hours, 10) || 0)).toLocaleString('ru-RU').replace(/,/g, ' '),
                                })}
                            </div>
                        )}

                        <div>
                            <Label htmlFor="pkg-desc" className="text-xs font-semibold">
                                {t('packages.desc_optional')}
                            </Label>
                            <Input
                                id="pkg-desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('packages.desc_placeholder')}
                                className="mt-1"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsModalOpen(false)}
                                disabled={submitting}
                            >
                                {t('packages.cancel_btn')}
                            </Button>
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                disabled={submitting}
                            >
                                {submitting ? t('packages.saving_btn') : (editingPackage ? t('packages.update_btn') : t('packages.save_btn'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
