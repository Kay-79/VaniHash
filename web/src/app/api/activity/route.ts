import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const mode = searchParams.get('mode') || 'market'; // market or tasks
        const limit = parseInt(searchParams.get('limit') || '10');

        let activities: any[] = [];

        if (mode === 'market') {
            // Fetch recent listings/sales
            const listings = await prisma.listing.findMany({
                orderBy: { timestamp_ms: 'desc' },
                take: limit,
            });

            activities = listings.map((l: any) => ({
                id: l.id,
                type: l.status === 'SOLD' ? 'SALE' : l.status === 'DELISTED' ? 'DELIST' : 'LIST',
                item: l.listing_id,
                price: l.price || l.price_sold || '0',
                image_url: l.image_url || '',
                timestamp: Number(l.timestamp_ms || 0),
                address: l.status === 'SOLD' ? l.buyer : l.seller,
                listing_type: l.type, // The actual object type (e.g. 0x2::kiosk::ItemListed<...>)
            }));
        } else {
            // Fetch recent tasks
            const tasks = await prisma.task.findMany({
                orderBy: { timestamp_ms: 'desc' },
                take: limit,
            });

            activities = tasks.map(t => ({
                id: t.id,
                type: t.status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_CREATED',
                item: t.task_id,
                price: t.reward_amount || '0',
                timestamp: Number(t.timestamp_ms || 0),
                address: t.status === 'COMPLETED' ? t.completer : t.creator,
                task_type: t.task_type,
                target_type: t.target_type,
            }));
        }

        return NextResponse.json(activities);
    } catch (e) {
        console.error("API /api/activity error:", e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
