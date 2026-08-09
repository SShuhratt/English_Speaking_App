import React from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
    userName?: string;
}

export default function DeleteUserModal({ isOpen, onClose, userId, userName }: Props) {
    const { t } = useTranslation();
    const [isDeleting, setIsDeleting] = React.useState(false);

    if (!userId) return null;

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/admin/users/${userId}`, {
            onSuccess: () => {
                setIsDeleting(false);
                onClose();
            },
            onError: () => {
                setIsDeleting(false);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <DialogTitle className="text-center text-lg font-bold text-gray-900 dark:text-gray-100">
                        {t('admin.confirm_delete_user_title')}
                    </DialogTitle>
                    <DialogDescription className="text-center text-xs text-gray-600 dark:text-gray-300">
                        {userName ? (
                            <>
                                {t('admin.confirm_delete_user_message')}{' '}
                                <strong className="text-gray-900 dark:text-gray-100 font-semibold">{userName}</strong>.
                            </>
                        ) : (
                            t('admin.confirm_delete_user_message')
                        )}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={onClose} disabled={isDeleting} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full bg-red-600 hover:bg-red-700 text-white sm:w-auto font-bold"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            t('admin.delete_user')
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
