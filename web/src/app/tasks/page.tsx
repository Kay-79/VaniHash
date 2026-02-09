'use client';

import { useState, Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TaskList } from '@/components/marketplace/TaskList';
import { useFetchTasks } from '@/hooks/useFetchTasks';
import { ArrowUpDown, List, LayoutGrid } from 'lucide-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { MinerStats } from '@/components/miner/MinerStats';

function MarketplaceContent() {
    const account = useCurrentAccount();
    const [sortBy, setSortBy] = useState<'time' | 'reward'>('time');
    const [viewMode, setViewMode] = useState<'table' | 'list'>('table');

    // Tab State: 'market' | 'my_tasks' | 'history'
    const [activeTab, setActiveTab] = useState('market');

    // Derived filters based on tab
    const fetchOptions = {
        market: { status: 'ACTIVE,PENDING', creator: undefined },
        my_tasks: { creator: account?.address, status: undefined },
        history: { status: 'COMPLETED,CANCELLED', creator: undefined }
    }[activeTab] || {};

    const { tasks, loading, loadingMore, hasMore, loadMore, refetch } = useFetchTasks(fetchOptions);

    // Sorting Logic
    const sortedTasks = [...(tasks || [])].sort((a, b) => {
        if (sortBy === 'reward') {
            return parseFloat(b.reward_amount) - parseFloat(a.reward_amount);
        }
        return Number(b.id) - Number(a.id);
    });

    return (
        <DashboardLayout activityMode="tasks">
            <div className="p-6 space-y-6">
                {/* Task Feed */}
                <div>
                    {/* Miner Stats */}
                    <div className="mb-6">
                        <MinerStats />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        {/* Tabs */}
                        <div className="flex bg-gray-900/50 p-1 rounded-xl border border-gray-800 w-fit">
                            <button
                                onClick={() => setActiveTab('market')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'market'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Market
                            </button>
                            <button
                                onClick={() => setActiveTab('my_tasks')}
                                disabled={!account}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'my_tasks'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed'
                                    }`}
                            >
                                My Tasks
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                History
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* View Mode Toggle */}
                            {/* <div className="flex bg-gray-900/50 p-1 rounded-lg border border-gray-800">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded transition-all ${viewMode === 'table'
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                    title="Table View"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded transition-all ${viewMode === 'list'
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                    title="List View"
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div> */}

                            {/* Sort Control */}
                            <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-lg border border-gray-800">
                                <ArrowUpDown className="h-4 w-4 text-gray-500 ml-2" />
                                <button
                                    onClick={() => setSortBy('time')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                        sortBy === 'time' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                                >
                                    Newest
                                </button>
                                <button
                                    onClick={() => setSortBy('reward')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                        sortBy === 'reward' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                                >
                                    Reward
                                </button>
                            </div>

                            <button
                                onClick={refetch}
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-900/30 rounded-lg border border-gray-800/50">
                        <TaskList 
                            tasks={sortedTasks} 
                            loading={loading} 
                            loadingMore={loadingMore}
                            hasMore={hasMore}
                            onLoadMore={loadMore}
                            viewMode={viewMode} 
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function MarketplacePage() {
    return (
        <Suspense fallback={
            <DashboardLayout activityMode="tasks">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-gray-400">Loading marketplace...</div>
                </div>
            </DashboardLayout>
        }>
            <MarketplaceContent />
        </Suspense>
    );
}
