type Availability = {
    id: number | string;
    type: string;
};

export default function AvailabilityPage({
    availabilities,
}: {
    availabilities: Availability[];
}) {
    return (
        <div>
            <h1>Availability</h1>

            {availabilities.map(item => (
                <div key={item.id}>
                    {item.type}
                </div>
            ))}
        </div>
    );
}