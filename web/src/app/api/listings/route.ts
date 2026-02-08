import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'ACTIVE';
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const itemType = searchParams.get('itemType');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

    try {
        const where: any = { status };

        if (type) {
            where.type = type;
        }

        // Optimized Item Type Filter using DB contains
        if (itemType) {
            if (itemType === 'GasObject') {
                where.type = { contains: '0x2::coin::Coin' };
            } else if (itemType === 'Package') {
                where.type = { contains: 'UpgradeCap' };
            } else {
                where.type = { contains: itemType };
            }
        }

        const listings = await prisma.listing.findMany({
            where,
            orderBy: [
                { timestamp_ms: 'desc' },
                { created_at: 'desc' }
            ],
        });

        const filtered = listings.filter(item => {
            // Search Filter
            if (search) {
                const s = search.toLowerCase();
                const matchesId = item.listing_id.toLowerCase().includes(s);
                const itemAny = item as any;
                const matchesItemId = itemAny.item_id ? itemAny.item_id.toLowerCase().includes(s) : false;
                const matchesType = item.type ? item.type.toLowerCase().includes(s) : false;
                if (!matchesId && !matchesType && !matchesItemId) return false;
            }

            // Price Filter
            if (!item.price) return true;
            const p = BigInt(item.price);
            if (minPrice && p < BigInt(minPrice)) return false;
            if (maxPrice && p > BigInt(maxPrice)) return false;

            return true;
        });

        const sliced = filtered.slice(0, limit);

        const serialized = JSON.parse(JSON.stringify(sliced, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serialized);
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
