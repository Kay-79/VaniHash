'use client';

import { useEffect, useState } from 'react';
import { INDEXER_URL } from '@/constants/chain';
import { ListingCard } from '@/components/marketplace/ListingCard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Listing {
    listing_id: string;
    seller: string;
    price: string;
    type: string;
    status: string;
    timestamp_ms: number;
}

export default function MarketplacePage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const fetchListings = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/listings?status=ACTIVE`);
            const data = await res.json();
            setListings(data);
        } catch (error) {
            console.error("Failed to fetch listings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
        const interval = setInterval(fetchListings, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    return (
        <DashboardLayout activityMode="market">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-black/90 backdrop-blur z-10">
                <div className="flex items-center gap-4">
                    <span className="text-white font-bold text-lg">{listings.length} Items</span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"/> 
                        Live
                    </span>
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

            {/* Grid */}
            <div className="p-6">
                {loading && listings.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">Loading listings...</div>
                ) : (
                    <div className={`grid gap-4 ${
                        viewMode === 'grid' 
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
                        : 'grid-cols-1'
                    }`}>
                        {listings.length > 0 ? (
                            listings.map((listing) => (
                                <ListingCard 
                                    key={listing.listing_id} 
                                    listing={listing} 
                                    onBuySuccess={fetchListings}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500">
                                <p className="text-lg">No active listings found</p>
                                <p className="text-sm">Be the first to list an item!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
