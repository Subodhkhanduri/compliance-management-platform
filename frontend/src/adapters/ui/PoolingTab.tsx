import { useState } from 'react';
import { ApiPort } from '../../core/ports/ApiPort';
import { usePooling } from '../../core/application/usePooling';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { KpiCard } from '../../shared/components/KpiCard';

const ALL_SHIPS = ['R001', 'R002', 'R003', 'R004', 'R005'];
const YEARS = [2024, 2025];

interface Props { api: ApiPort }

export function PoolingTab({ api }: Props) {
    const [selectedShips, setSelectedShips] = useState<string[]>(['R001', 'R002', 'R003']);
    const [year, setYear] = useState(2024);
    const [loaded, setLoaded] = useState(false);

    const {
        members, poolResult, loading, creating,
        error, poolSum, isValidPool,
        loadMembers, createPool,
    } = usePooling(api);

    const toggleShip = (ship: string) => {
        setSelectedShips(prev =>
            prev.includes(ship) ? prev.filter(s => s !== ship) : [...prev, ship]
        );
        setLoaded(false);
    };

    const handleLoad = async () => {
        await loadMembers(selectedShips, year);
        setLoaded(true);
    };

    const handleCreate = async () => {
        await createPool(year, selectedShips);
    };

    return (
        <div className="space-y-6">
            {/* Config */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Year</label>
                        <select
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            value={year}
                            onChange={e => { setYear(Number(e.target.value)); setLoaded(false); }}
                        >
                            {YEARS.map(y => <option key={y}>{y}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-2">
                            Select ships for pool (min. 2)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {ALL_SHIPS.map(ship => (
                                <button
                                    key={ship}
                                    onClick={() => toggleShip(ship)}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors
                    ${selectedShips.includes(ship)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {ship}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleLoad}
                        disabled={selectedShips.length < 2 || loading}
                        className="self-end rounded-lg bg-gray-800 px-4 py-2 text-sm text-white
              hover:bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400
              disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? '…' : 'Load CBs'}
                    </button>
                </div>
            </div>

            {error && <ErrorBanner message={error} />}
            {loading && <LoadingSpinner />}

            {loaded && members.length > 0 && !poolResult && (
                <>
                    {/* Pool sum KPI */}
                    <div className="grid grid-cols-3 gap-4">
                        <KpiCard
                            label="Pool Sum (CB)"
                            value={`${poolSum.toLocaleString(undefined, { maximumFractionDigits: 0 })} gCO₂eq`}
                            sub={isValidPool ? '≥ 0 — valid' : '< 0 — invalid'}
                            highlight={isValidPool ? 'green' : 'red'}
                        />
                        <KpiCard
                            label="Members"
                            value={members.length}
                            sub="ships in pool"
                            highlight="neutral"
                        />
                        <KpiCard
                            label="Pool Status"
                            value={isValidPool ? 'Valid ✅' : 'Invalid ❌'}
                            sub={isValidPool ? 'Can create pool' : 'Deficit exceeds surplus'}
                            highlight={isValidPool ? 'green' : 'red'}
                        />
                    </div>

                    {/* Members table */}
                    <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800 text-sm">
                                Pool Members — Adjusted CB
                            </h3>
                            <button
                                onClick={handleCreate}
                                disabled={!isValidPool || creating}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white
                  hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400
                  disabled:cursor-not-allowed transition-colors"
                            >
                                {creating ? 'Creating…' : 'Create Pool (Art. 21)'}
                            </button>
                        </div>
                        <table className="min-w-full divide-y divide-gray-50 text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Ship ID</th>
                                    <th className="px-4 py-3 text-left">Adjusted CB</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {members.map(m => (
                                    <tr key={m.shipId} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono font-medium text-blue-700">
                                            {m.shipId}
                                        </td>
                                        <td className={`px-4 py-3 font-medium
                      ${m.adjustedCb >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {m.adjustedCb.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            <span className="text-xs text-gray-400 ml-1">gCO₂eq</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium
                        ${m.isSurplus ? 'text-green-700' : 'text-red-700'}`}>
                                                {m.isSurplus ? '● Surplus' : '● Deficit'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Pool result */}
            {poolResult && (
                <div className="rounded-xl bg-green-50 border border-green-200 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-green-700 font-semibold">
                            ✅ Pool Created — ID: {poolResult.poolId.slice(0, 8)}…
                        </span>
                    </div>
                    <table className="min-w-full divide-y divide-green-100 text-sm bg-white rounded-lg overflow-hidden">
                        <thead className="bg-green-50 text-xs text-green-700 uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Ship</th>
                                <th className="px-4 py-3 text-left">CB Before</th>
                                <th className="px-4 py-3 text-left">Allocated</th>
                                <th className="px-4 py-3 text-left">CB After</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {poolResult.members.map(m => (
                                <tr key={m.shipId}>
                                    <td className="px-4 py-3 font-mono font-medium text-blue-700">
                                        {m.shipId}
                                    </td>
                                    <td className={`px-4 py-3 font-medium
                    ${m.cbBefore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {m.cbBefore.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="px-4 py-3 text-blue-600 font-medium">
                                        {m.allocatedSurplus > 0
                                            ? `+${m.allocatedSurplus.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                            : '—'}
                                    </td>
                                    <td className={`px-4 py-3 font-semibold
                    ${m.cbAfter >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {m.cbAfter.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
