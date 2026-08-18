import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();
    const name = user.name || user.full_name || '';

    return (
        <>
            <Avatar className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-white p-0.5 shadow-sm">
                <AvatarImage
                    src={user.avatar}
                    alt={name}
                    className="h-full w-full rounded-full object-contain"
                />
                <AvatarFallback className="rounded-full bg-neutral-200 text-black">
                    {getInitials(name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
