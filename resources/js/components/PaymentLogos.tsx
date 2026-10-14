import React from 'react';

interface LogoProps {
    className?: string;
    alt?: string;
}

export function ClickLogo({ className = 'h-6 w-auto' }: LogoProps) {
    return (
        <img
            src="/images/payments/click.png"
            alt="Click"
            className={`object-contain rounded-md ${className}`}
            loading="eager"
        />
    );
}

export function PaymeLogo({ className = 'h-6 w-auto' }: LogoProps) {
    return (
        <img
            src="/images/payments/payme.png"
            alt="Payme"
            className={`object-contain rounded-md ${className}`}
            loading="eager"
        />
    );
}

export function UzumLogo({ className = 'h-6 w-auto' }: LogoProps) {
    return (
        <img
            src="/images/payments/uzum.png"
            alt="Uzum Bank"
            className={`object-contain rounded-md ${className}`}
            loading="eager"
        />
    );
}

export function PaymentAppIcon({
    app,
    className = 'h-6 w-auto',
}: {
    app: 'click' | 'payme' | 'uzum';
    className?: string;
}) {
    if (app === 'click') return <ClickLogo className={className} />;
    if (app === 'payme') return <PaymeLogo className={className} />;
    return <UzumLogo className={className} />;
}
