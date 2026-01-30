import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const address = (await params).id;
    try {
        const [createdTasks, minedTasks, listings] = await Promise.all([
            prisma.task.count({ where: { creator: address } }),
            prisma.task.count({ where: { completer: address } as any }),
            prisma.listing.findMany({ 
                where: { seller: address },
                take: 10,
                orderBy: { created_at: 'desc' }
            })
        ]);

        const stats = {
            address,
            totalCreated: createdTasks,
            totalMined: minedTasks,
            recentListings: listings
        };

        const serialized = JSON.parse(JSON.stringify(stats, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serialized);
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
