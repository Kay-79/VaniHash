'use client';

import { useState, Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ListingTable } from '@/components/marketplace/ListingTable';
import { ListingModal } from '@/components/marketplace/ListingModal';
import { useFetchListings } from '@/hooks/useFetchListings';
import { MarketplaceStats } from '@/components/marketplace/MarketplaceStats';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCurrentAccount } from '@mysten/dapp-kit';

function MarketContent() {
    const account = useCurrentAccount();
    const [viewMode, setViewMode] = useState<'list'>('list'); // Grid view pending
    const [searchTerm, setSearchTerm] = useState('');

    const { listings, loading, refetch } = useFetchListings();

    return (
        <DashboardLayout activityMode="market">
            <div className="p-6 space-y-6">

                {/* Market Stats */}
                <div className="mb-6">
                    <MarketplaceStats />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        Marketplace <span className="text-sm font-normal text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">{listings.length} Items</span>
                    </h2>

                    <div className="flex items-center gap-3">
                        <ListingModal />

                        <button
                            onClick={refetch}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors ml-2"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="bg-gray-900/30 rounded-lg border border-gray-800/50 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading market data...</div>
                    ) : (
                        <ListingTable listings={listings} onBuySuccess={refetch} />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function MarketplacePage() {
    return (
        <Suspense fallback={
            <DashboardLayout activityMode="market">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-gray-400">Loading market...</div>
                </div>
            </DashboardLayout>
        }>
            <MarketContent />
        </Suspense>
    );
}
