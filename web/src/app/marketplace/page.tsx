'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { INDEXER_URL } from '@/constants/chain';
import { ListingCard } from '@/components/marketplace/ListingCard';
import { MarketplaceStats } from '@/components/marketplace/MarketplaceStats';
import { ListingTable } from '@/components/marketplace/ListingTable';
import { ListingModal } from '@/components/marketplace/ListingModal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSearchParams } from 'next/navigation';

interface Listing {
    listing_id: string;
    seller: string;
    price: string;
    type: string;
    status: string;
    timestamp_ms: number;
}

function MarketplaceContent() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const searchParams = useSearchParams();

    const fetchListings = useCallback(async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams(searchParams.toString());
            if (!query.has('status')) query.set('status', 'ACTIVE'); // Default

            const res = await fetch(`/api/listings?${query.toString()}`);
            const data = await res.json();
            setListings(data);
        } catch (error) {
            console.error("Failed to fetch listings:", error);
        } finally {
            setLoading(false);
        }
    }, [searchParams]);

    // Re-fetch when params change
    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    return (
        <DashboardLayout activityMode="market">
            {/* Stats Header */}
            <MarketplaceStats />

            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-black/90 backdrop-blur z-10">
                <div className="flex items-center gap-4">
                    <span className="text-white font-bold text-lg">{listings.length} Items</span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        Live
                    </span>
                    <div className="ml-4">
                        <ListingModal />
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
                    <Button
                        variant={viewMode === 'grid' ? "secondary" : "ghost"}
                        size="sm"
                        className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-gray-800 text-yellow-500' : 'text-gray-500'}`}
                        onClick={() => setViewMode('grid')}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? "secondary" : "ghost"}
                        size="sm"
                        className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-gray-800 text-yellow-500' : 'text-gray-500'}`}
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Grid/List View */}
            <div className="p-6">
                {loading && listings.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">Loading listings...</div>
                ) : (
                    <>
                        {listings.length > 0 ? (
                            viewMode === 'grid' ? (
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                    {listings.map((listing) => (
                                        <ListingCard
                                            key={listing.listing_id}
                                            listing={listing}
                                            onBuySuccess={fetchListings}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <ListingTable listings={listings} onBuySuccess={fetchListings} />
                            )
                        ) : (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500">
                                <p className="text-lg">No active listings found</p>
                                <p className="text-sm">Be the first to list an item!</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

export default function MarketplacePage() {
    return (
        <Suspense fallback={
            <DashboardLayout activityMode="market">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-gray-400">Loading marketplace...</div>
                </div>
            </DashboardLayout>
        }>
            <MarketplaceContent />
        </Suspense>
    );
}
