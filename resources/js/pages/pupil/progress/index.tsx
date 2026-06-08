interface PupilProgressProps {
    stats: {
        sessions_completed: number;
        upcoming_sessions: number;
    };
}

export default function PupilProgress({ stats }: PupilProgressProps) {
    return (
        <div className="p-6 space-y-6">
            <h1 className="text-xl font-bold">
                My Progress
            </h1>

            <div className="grid grid-cols-2 gap-4">
                <div className="border p-4 rounded-xl">
                    <p className="text-sm text-gray-500">
                        Completed Sessions
                    </p>
                    <p className="text-2xl font-bold">
                        {stats.sessions_completed}
                    </p>
                </div>

                <div className="border p-4 rounded-xl">
                    <p className="text-sm text-gray-500">
                        Upcoming Sessions
                    </p>
                    <p className="text-2xl font-bold">
                        {stats.upcoming_sessions}
                    </p>
                </div>
            </div>
        </div>
    );
}