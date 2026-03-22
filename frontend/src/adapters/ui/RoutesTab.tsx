import { ApiPort } from '../../core/ports/ApiPort';
import { useRoutes } from '../../core/application/useRoutes';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { Badge } from '../../shared/components/Badge';

const VESSEL_TYPES = ['Container', 'BulkCarrier', 'Tanker', 'RoRo'];
const FUEL_TYPES = ['HFO', 'LNG', 'MGO'];
const YEARS = [2024, 2025];

interface Props { api: ApiPort }

export function RoutesTab({ api }: Props) {
    const {
        routes, loading, error,
        filters, setFilters, handleSetBaseline,
    } = useRoutes(api);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <select
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={filters.vesselType ?? ''}
                    onChange={e => setFilters(f => ({ ...f, vesselType: e.target.value || undefined }))}
                >
                    <option value="">All vessel types</option>
                    {VESSEL_TYPES.map(v => <option key={v}>{v}</option>)}
                </select>

                <select
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={filters.fuelType ?? ''}
                    onChange={e => setFilters(f => ({ ...f, fuelType: e.target.value || undefined }))}
                >
                    <option value="">All fuel types</option>
                    {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
                </select>

                <select
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={filters.year ?? ''}
                    onChange={e => setFilters(f => ({
                        ...f, year: e.target.value ? Number(e.target.value) : undefined,
                    }))}
                >
                    <option value="">All years</option>
                    {YEARS.map(y => <option key={y}>{y}</option>)}
                </select>

                <button
                    onClick={() => setFilters({})}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                >
                    Clear
                </button>
            </div>

            {error && <ErrorBanner message={error} />}
            {loading && <LoadingSpinner />}

            {/* Table */}
            {!loading && (
                <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                            <tr>
                                {[
                                    'Route ID', 'Vessel Type', 'Fuel', 'Year',
                                    'GHG Intensity', 'Fuel (t)', 'Distance (km)',
                                    'Emissions (t)', 'Baseline', 'Action',
                                ].map(h => (
                                    <th key={h} className="px-4 py-3 text-left font-medium">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {routes.map(route => (
                                <tr
                                    key={route.routeId}
                                    className={`transition-colors hover:bg-gray-50
                    ${route.isBaseline ? 'bg-blue-50' : ''}`}
                                >
                                    <td className="px-4 py-3 font-mono font-medium text-blue-700">
                                        {route.routeId}
                                    </td>
                                    <td className="px-4 py-3">{route.vesselType}</td>
                                    <td className="px-4 py-3">
                                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium">
                                            {route.fuelType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{route.year}</td>
                                    <td className="px-4 py-3 font-medium">
                                        <span className={
                                            route.ghgIntensity <= 89.3368
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }>
                                            {route.ghgIntensity.toFixed(2)}
                                        </span>
                                        <span className="text-gray-400 text-xs ml-1">gCO₂e/MJ</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {route.fuelConsumption.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {route.distance.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {route.totalEmissions.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        {route.isBaseline
                                            ? <span className="text-blue-600 font-medium text-xs">● Baseline</span>
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {!route.isBaseline && (
                                            <button
                                                onClick={() => handleSetBaseline(route.routeId)}
                                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white
                          hover:bg-blue-700 transition-colors"
                                            >
                                                Set Baseline
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
