interface Session {
    id: number;
    teacher?: {
        full_name: string;
    };
    start_at: string;
}

interface PupilSessionsProps {
    sessions: Session[];
}

export default function PupilSessions({ sessions }: PupilSessionsProps) {
    return (
        <div className="p-6 space-y-4">
            <h1 className="text-xl font-bold">Past Sessions</h1>

            {sessions.length === 0 && (
                <p className="text-gray-500">
                    No past sessions yet
                </p>
            )}

            {sessions.map((s) => (
                <div key={s.id} className="border p-4 rounded-xl">
                    <p className="font-semibold">
                        {s.teacher?.full_name}
                    </p>

                    <p className="text-sm text-gray-500">
                        {new Date(s.start_at).toLocaleString()}
                    </p>

                    <p className="text-xs text-green-600">
                        Completed
                    </p>
                </div>
            ))}
        </div>
    );
}