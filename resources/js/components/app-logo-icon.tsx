import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 120 120"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <clipPath id="logo-circle-clip">
                    <circle cx="60" cy="60" r="56" />
                </clipPath>
            </defs>

            {/* White Circle Background */}
            <circle cx="60" cy="60" r="56" fill="white" />
            
            {/* Embed the high-fidelity transparent logo image, clipped to the circle */}
            <image 
                href="/images/logo.png" 
                x="18" 
                y="18" 
                width="84" 
                height="84" 
                clipPath="url(#logo-circle-clip)"
            />
        </svg>
    );
}
