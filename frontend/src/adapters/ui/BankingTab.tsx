import { useState, useEffect } from 'react';
import { ApiPort } from '../../core/ports/ApiPort';
import { useBanking } from '../../core/application/useBanking';
import { KpiCard } from '../../shared/components/KpiCard';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';

const SHIPS = ['R001', 'R002', 'R003', 'R004', 'R005'];
const YEARS = [2024, 2025];

interface Props { api: ApiPort }

export function BankingTab({ api }: Props) {
    const [selectedShip, setSelectedShip] = useState('R002');
    const [selectedYear, setSelectedYear] = useState(2024);
    const [bankAmount, setBankAmount] = useState('');
    const [applyAmount, setApplyAmount] = useState('');

    const {
        cb, records, loading, actionLoading,
        error, success, loadData, bank, apply,
    } = useBanking(api);

    useEffect(() => {
        loadData(selectedShip, selectedYear);
    }, [selectedShip, selectedYear, loadData]);

    const hasSurplus = (cb?.cbGco2eq ?? 0) > 0;
    const hasBanked = (records?.totalBanked ?? 0) > 0;

    return (
        <div className="space-y-6">
            {/* Ship / Year selector */}
            <div className="flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Ship ID</label>
                    <select
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        value={selectedShip}
                        onChange={e => setSelectedShip(e.target.value)}
                    >
                        {SHIPS.map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Year</label>
                    <select
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                    >
                        {YEARS.map(y => <option key={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {error && <ErrorBanner message={error} />}
            {success && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
                    ✅ {success}
                </div>
            )}

            {loading && <LoadingSpinner />}

            {!loading && cb && (
                <>
                    {/* KPI row */}
                    <div className="grid grid-cols-3 gap-4">
                        <KpiCard
                            label="Compliance Balance"
                            value={`${cb.cbGco2eq.toLocaleString(undefined, { maximumFractionDigits: 0 })} gCO₂eq`}
                            sub={cb.isSurplus ? 'Surplus ✅' : 'Deficit ❌'}
                            highlight={cb.isSurplus ? 'green' : 'red'}
                        />
                        <KpiCard
                            label="Total Banked"
                            value={`${(records?.totalBanked ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} gCO₂eq`}
                            sub="available to apply"
                            highlight={hasBanked ? 'green' : 'neutral'}
                        />
                        <KpiCard
                            label="GHG Intensity"
                            value={`${cb.ghgIntensity.toFixed(2)} gCO₂e/MJ`}
                            sub={`vs target 89.3368`}
                            highlight={cb.isSurplus ? 'green' : 'red'}
                        />
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Bank surplus */}
                        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-800 mb-1">
                                Bank Surplus (Art. 20)
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">
                                Save your surplus CB for use in a future year.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Amount (gCO₂eq)"
                                    value={bankAmount}
                                    onChange={e => setBankAmount(e.target.value)}
                                    disabled={!hasSurplus}
                                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm
                    disabled:bg-gray-50 disabled:text-gray-400"
                                />
                                <button
                                    disabled={!hasSurplus || !bankAmount || actionLoading}
                                    onClick={async () => {
                                        await bank(selectedShip, selectedYear, Number(bankAmount));
                                        setBankAmount('');
                                    }}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white
                    hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400
                    disabled:cursor-not-allowed transition-colors"
                                >
                                    {actionLoading ? '…' : 'Bank'}
                                </button>
                            </div>
                            {!hasSurplus && (
                                <p className="mt-2 text-xs text-red-500">
                                    No surplus available — CB is negative
                                </p>
                            )}
                        </div>

                        {/* Apply banked */}
                        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-800 mb-1">
                                Apply Banked (Art. 20)
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">
                                Apply previously banked surplus to cover a current deficit.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Amount (gCO₂eq)"
                                    value={applyAmount}
                                    onChange={e => setApplyAmount(e.target.value)}
                                    disabled={!hasBanked}
                                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm
                    disabled:bg-gray-50 disabled:text-gray-400"
                                />
                                <button
                                    disabled={!hasBanked || !applyAmount || actionLoading}
                                    onClick={async () => {
                                        await apply(selectedShip, selectedYear, Number(applyAmount));
                                        setApplyAmount('');
                                    }}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white
                    hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400
                    disabled:cursor-not-allowed transition-colors"
                                >
                                    {actionLoading ? '…' : 'Apply'}
                                </button>
                            </div>
                            {!hasBanked && (
                                <p className="mt-2 text-xs text-red-500">
                                    No banked surplus available for this ship/year
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Bank history */}
                    {records && records.entries.length > 0 && (
                        <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-800 text-sm">Bank History</h3>
                            </div>
                            <table className="min-w-full divide-y divide-gray-50 text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Entry ID</th>
                                        <th className="px-4 py-2 text-left">Amount (gCO₂eq)</th>
                                        <th className="px-4 py-2 text-left">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {records.entries.map(e => (
                                        <tr key={e.id}>
                                            <td className="px-4 py-2 font-mono text-xs text-gray-500">
                                                {e.id.slice(0, 8)}…
                                            </td>
                                            <td className="px-4 py-2 text-green-700 font-medium">
                                                +{e.amountGco2eq.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 text-gray-500 text-xs">
                                                {new Date(e.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
