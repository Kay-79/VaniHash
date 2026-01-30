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
    const length = searchParams.get('length');

    try {
        const where: any = { status };
        
        // Basic type filtering if provided
        if (type) {
            where.type = type;
        }

        const listings = await prisma.listing.findMany({
            where,
            orderBy: { timestamp_ms: 'desc' },
        });

        const filtered = listings.filter(item => {
            // Search Filter
            if (search) {
                const s = search.toLowerCase();
                const matchesId = item.listing_id.toLowerCase().includes(s);
                const matchesType = item.type ? item.type.toLowerCase().includes(s) : false;
                if (!matchesId && !matchesType) return false;
            }

            // Price Filter
            if (!item.price) return true;
            const p = BigInt(item.price);
            if (minPrice && p < BigInt(minPrice)) return false;
            if (maxPrice && p > BigInt(maxPrice)) return false;

            // Pattern Length Filter (e.g. check ID length or specific metadata field if available)
            // For now, checking Listing ID length as proxy or assume metadata
            if (length) {
                // If ID is hex (0x...), length check might need adjustment. 
                // Assuming vanity hashes are the patterns themselves or part of ID.
                // Simplest: Check ID length minus 2 (for 0x)? Or just ID length.
                // Adjust logic as per actual pattern storage. Here using ID length for demo.
                // If length is "8+", handle >= 8
                const idLen = item.listing_id.startsWith('0x') ? item.listing_id.length - 2 : item.listing_id.length; // Approximate
                if (length === '8+') {
                    if (idLen < 8) return false;
                } else {
                    if (idLen !== parseInt(length)) return false;
                }
            }

            // Item Type Filter (Mock logic based on type string)
            if (itemType) {
                 // Check if item.type string contains the short name
                 // e.g. 0x...::miner::GasObject contains "GasObject"
                 if (item.type && !item.type.includes(itemType)) return false;
            }
            
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
