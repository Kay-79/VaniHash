import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'ACTIVE';
    const type = searchParams.get('type');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    try {
        const where: any = { status };
        
        if (type) {
            where.type = type;
        }

        // Note: Filtering by string price in DB is not ideal for ranges, 
        // but Prisma doesn't support casting string to int in findMany 'where' easily without raw query.
        // For now, we'll fetch then filter if price range is strictly needed, 
        // OR rely on the client to handle small datasets. 
        // A better approach is to store price as BigInt in DB (we do schema strings currently).
        
        const listings = await prisma.listing.findMany({
            where,
            orderBy: { timestamp_ms: 'desc' },
        });

        // Manual filtering for price (since schema stores it as String)
        const filtered = listings.filter(item => {
            if (!item.price) return true;
            const p = BigInt(item.price);
            if (minPrice && p < BigInt(minPrice)) return false;
            if (maxPrice && p > BigInt(maxPrice)) return false;
            return true;
        });

        const serialized = JSON.parse(JSON.stringify(filtered, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serialized);
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
