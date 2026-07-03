export default function AppLogo() {
    return (
        <>
            {/* Circle logo frame matching the landing page style */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#061445]/10 bg-white shadow-md shadow-[#061445]/10 transition-transform group-hover:scale-105">
                <img
                    src="/logo.png"
                    alt="ConvoMate"
                    className="h-full w-full object-cover"
                />
            </div>
            <span className="ml-1 text-base font-black tracking-tight text-[#061445] dark:text-[#E8E8F0]">
                Convo<span className="text-[#f5c518]">Mate</span>
            </span>
        </>
    );
}
