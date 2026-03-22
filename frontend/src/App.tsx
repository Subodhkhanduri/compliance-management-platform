import { useState } from 'react';
import { apiClient } from './infrastructure/api/apiClient';
import { RoutesTab } from './adapters/ui/RoutesTab';
import { CompareTab } from './adapters/ui/CompareTab';
import { BankingTab } from './adapters/ui/BankingTab';
import { PoolingTab } from './adapters/ui/PoolingTab';

const TABS = ['Routes', 'Compare', 'Banking', 'Pooling'] as const;
type Tab = typeof TABS[number];

export default function App() {
    const [active, setActive] = useState<Tab>('Routes');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">
                            ⚓ FuelEU Maritime
                        </h1>
                        <p className="text-xs text-gray-400">
                            Compliance Dashboard — EU 2023/1805
                        </p>
                    </div>
                </div>

                {/* Tab bar */}
                <div className="max-w-7xl mx-auto px-6">
                    <nav className="flex gap-1">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActive(tab)}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${active === tab
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Tab content */}
            <main className="max-w-7xl mx-auto px-6 py-6">
                {active === 'Routes' && <RoutesTab api={apiClient} />}
                {active === 'Compare' && <CompareTab api={apiClient} />}
                {active === 'Banking' && <BankingTab api={apiClient} />}
                {active === 'Pooling' && <PoolingTab api={apiClient} />}
            </main>
        </div>
    );
}
