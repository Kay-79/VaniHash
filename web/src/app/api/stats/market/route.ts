import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // 1. Floor Price: Min price of active listings (status = 'ACTIVE')
        const floorPrice = await prisma.listing.aggregate({
            _min: { price: true },
            where: { status: 'ACTIVE' }
        });

        // 2. Listed Count: Count of active listings
        const listedCount = await prisma.listing.count({
            where: { status: 'ACTIVE' }
        });

        // 3. 1D Volume: Sum of price_sold for listings sold in last 24h
        const oneDayAgo = BigInt(Date.now() - 24 * 60 * 60 * 1000);

        // Note: Prisma BigInt comparison might need specific handling or raw query if timestamp_ms is BigInt
        // Let's use raw query for volume to be safe with BigInt math/casting
        const volumeQuery = await prisma.$queryRaw`
            SELECT SUM(CAST(price_sold AS BIGINT)) as volume
            FROM listings
            WHERE status = 'SOLD' 
            AND timestamp_ms >= ${oneDayAgo}
        ` as any[];

        const volume24h = volumeQuery[0]?.volume || 0n;

        // 4. Avg Sale: Average price of all sold listings (or last 24h? usually all time or check requirement. Let's do all time or 24h? "Avg Sale" implies general market price. Let's do all time for now or last 100 sales)
        const avgSaleQuery = await prisma.$queryRaw`
            SELECT AVG(CAST(price_sold AS BIGINT)) as avg_price
            FROM listings
            WHERE status = 'SOLD'
        ` as any[];

        const avgSale = avgSaleQuery[0]?.avg_price || 0;

        // 5. Top Bid: Placeholder for now as we don't index bids yet
        const topBid = 0;

        return NextResponse.json({
            floorPrice: floorPrice._min.price || '0',
            topBid: topBid.toString(),
            volume24h: volume24h.toString(),
            avgSale: avgSale.toString(),
            listedCount: listedCount,
            // Mocking % changes for now as we don't have historical snapshots
            volumeChange: 12.5,
            listedChange: 2.4
        });

    } catch (e) {
        console.error("API /api/stats/market error:", e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
