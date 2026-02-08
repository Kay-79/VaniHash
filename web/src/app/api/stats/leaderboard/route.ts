import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') || 'miners'; // miners, traders, creators
        const limit = parseInt(searchParams.get('limit') || '10');

        let data = [];

        if (type === 'miners') {
            // Top Miners: Group by completer, count tasks, sum rewards
            // Note: Prisma usually returns strings for BigInt, we need to handle that.
            // Since reward_amount is String in DB, we can't sum it directly in Prisma simply if it's stored as string with units.
            // Assuming reward_amount is numeric string (SUI MIST).

            // For now, simpler approach: Group by completer and count. 
            // Summing strings is hard in Prisma GroupBy. We might need raw query or just count.
            // Let's do raw query for best performance and flexibility with numeric casts.

            const miners = await prisma.$queryRaw`
                SELECT 
                    completer as address, 
                    COUNT(*) as "totalMined", 
                    SUM(CAST(reward_amount AS BIGINT)) as "totalRewards"
                FROM tasks 
                WHERE status = 'COMPLETED' AND completer IS NOT NULL
                GROUP BY completer 
                ORDER BY "totalRewards" DESC 
                LIMIT ${limit}
            ` as any[];
            data = miners;
        }
        else if (type === 'creators') {
            // Top Spenders: (Creators + Traders)
            // Includes Task Rewards (excluding Cancelled) + Listing Purchases
            const spenders = await prisma.$queryRaw`
                SELECT 
                    T.address, 
                    SUM(T.cnt) as "tasksCreated", -- Acts as "Total Actions" count
                    SUM(T.spent) as "sUISpent"
                FROM (
                    SELECT creator as address, CAST(reward_amount AS BIGINT) as spent, 1 as cnt
                    FROM tasks 
                    WHERE creator IS NOT NULL AND status != 'CANCELLED'
                    
                    UNION ALL
                    
                    SELECT buyer as address, CAST(price_sold AS BIGINT) as spent, 1 as cnt
                    FROM listings 
                    WHERE status = 'SOLD' AND buyer IS NOT NULL
                ) as T
                GROUP BY T.address
                ORDER BY "sUISpent" DESC 
                LIMIT ${limit}
            ` as any[];
            data = spenders;
        }
        else if (type === 'traders') {
            // Top Traders: buying volume
            // We can look at listings where status = 'SOLD'
            const traders = await prisma.$queryRaw`
                SELECT 
                    buyer as address, 
                    COUNT(*) as "itemsBought",
                    SUM(CAST(price_sold AS BIGINT)) as "volume"
                FROM listings 
                WHERE status = 'SOLD' AND buyer IS NOT NULL
                GROUP BY buyer 
                ORDER BY "volume" DESC 
                LIMIT ${limit}
            ` as any[];
            data = traders;
        }

        // Serialization for BigInt
        const serialized = JSON.parse(JSON.stringify(data, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // Format rewards/volume from MIST to SUI (divide by 1e9) for display if needed, 
        // or let frontend handle it. Let's return raw MIST and let frontend format.

        return NextResponse.json(serialized);
    } catch (e) {
        console.error("API /api/stats/leaderboard error:", e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
