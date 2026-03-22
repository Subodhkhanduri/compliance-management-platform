interface KpiCardProps {
    label: string;
    value: string | number;
    sub?: string;
    highlight?: 'green' | 'red' | 'neutral';
}

export function KpiCard({ label, value, sub, highlight = 'neutral' }: KpiCardProps) {
    const colors = {
        green: 'border-green-400 bg-green-50',
        red: 'border-red-400 bg-red-50',
        neutral: 'border-gray-200 bg-white',
    };

    return (
        <div className={`rounded-xl border-l-4 p-4 shadow-sm ${colors[highlight]}`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
    );
}
