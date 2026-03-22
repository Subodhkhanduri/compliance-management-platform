import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import { ApiPort } from '../../core/ports/ApiPort';
import { useComparison } from '../../core/application/useComparison';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { Badge } from '../../shared/components/Badge';
import { KpiCard } from '../../shared/components/KpiCard';

const TARGET = 89.3368;

interface Props { api: ApiPort }

export function CompareTab({ api }: Props) {
    const { data, loading, error } = useComparison(api);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorBanner message={error} />;
    if (!data) return null;

    const chartData = [
        {
            name: `${data.baseline.routeId} (baseline)`,
            ghg: data.baseline.ghgIntensity,
            isBaseline: true,
        },
        ...data.comparisons.map(c => ({
            name: c.route.routeId,
            ghg: c.route.ghgIntensity,
            isBaseline: false,
            compliant: c.compliant,
        })),
    ];

    const compliantCount = data.comparisons.filter(c => c.compliant).length;

    return (
        <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-4">
                <KpiCard
                    label="EU Target"
                    value="89.34 gCO₂e/MJ"
                    sub="2% below 91.16"
                    highlight="neutral"
                />
                <KpiCard
                    label="Baseline GHG"
                    value={`${data.baseline.ghgIntensity.toFixed(2)} gCO₂e/MJ`}
                    sub={data.baseline.routeId}
                    highlight={data.baseline.ghgIntensity <= TARGET ? 'green' : 'red'}
                />
                <KpiCard
                    label="Compliant Routes"
                    value={`${compliantCount} / ${data.comparisons.length}`}
                    sub="vs EU target"
                    highlight={compliantCount > 0 ? 'green' : 'red'}
                />
            </div>

            {/* Chart */}
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                <h3 className="mb-4 text-sm font-semibold text-gray-700">
                    GHG Intensity vs EU Target
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis
                            domain={[85, 96]}
                            tickFormatter={v => `${v}`}
                            tick={{ fontSize: 12 }}
                            label={{
                                value: 'gCO₂e/MJ',
                                angle: -90,
                                position: 'insideLeft',
                                style: { fontSize: 11 },
                            }}
                        />
                        <Tooltip
                            formatter={(v: number) => [`${v.toFixed(2)} gCO₂e/MJ`, 'GHG Intensity']}
                        />
                        <ReferenceLine
                            y={TARGET}
                            stroke="#ef4444"
                            strokeDasharray="6 3"
                            label={{
                                value: `Target: ${TARGET}`,
                                position: 'right',
                                fontSize: 11,
                                fill: '#ef4444',
                            }}
                        />
                        <Bar dataKey="ghg" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, i) => (
                                <Cell
                                    key={i}
                                    fill={
                                        entry.isBaseline
                                            ? '#6366f1'
                                            : entry.ghg <= TARGET
                                                ? '#22c55e'
                                                : '#f87171'
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-3 w-3 rounded-sm bg-indigo-400" />
                        Baseline
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-3 w-3 rounded-sm bg-green-400" />
                        Compliant
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-3 w-3 rounded-sm bg-red-400" />
                        Non-compliant
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-3 w-3 rounded-sm bg-red-500 opacity-50" />
                        — EU Target line
                    </span>
                </div>
            </div>

            {/* Comparison table */}
            <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                        <tr>
                            {['Route', 'Vessel', 'Fuel', 'GHG Intensity', '% vs Baseline', 'vs Target', 'Status'].map(h => (
                                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.comparisons.map(entry => (
                            <tr key={entry.route.routeId} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-mono font-medium text-blue-700">
                                    {entry.route.routeId}
                                </td>
                                <td className="px-4 py-3">{entry.route.vesselType}</td>
                                <td className="px-4 py-3">
                                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium">
                                        {entry.route.fuelType}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-medium">
                                    {entry.route.ghgIntensity.toFixed(2)}
                                    <span className="text-gray-400 text-xs ml-1">gCO₂e/MJ</span>
                                </td>
                                <td className={`px-4 py-3 font-medium
                  ${entry.percentDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {entry.percentDiff > 0 ? '+' : ''}
                                    {entry.percentDiff.toFixed(2)}%
                                </td>
                                <td className={`px-4 py-3 font-medium
                  ${entry.vsTarget > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {entry.vsTarget > 0 ? '+' : ''}
                                    {entry.vsTarget.toFixed(4)}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge value={entry.compliant} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
