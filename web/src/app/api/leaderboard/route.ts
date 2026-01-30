import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { mistToSui } from '@/utils/formatters';

export async function GET(request: NextRequest) {
    try {
        // 1. Top Miners (Tasks Completed)
        const topMiners = await prisma.task.groupBy({
            by: ['completer'],
            where: { 
                status: 'COMPLETED',
                completer: { not: null } 
            },
            _count: {
                task_id: true,
            },
            orderBy: {
                _count: {
                    task_id: 'desc',
                }
            },
            take: 10,
        });

        // 2. Top Traders (Volume Bought) - This is an approximation as we store strings
        // Ideally we would aggregate in SQL, but for now we fetch and compute
        const soldListings = await prisma.listing.findMany({
            where: { 
                status: 'SOLD',
                buyer: { not: null }
            },
            select: {
                buyer: true,
                price_sold: true,
            }
        });

        const volumeByBuyer: Record<string, bigint> = {};
        soldListings.forEach(item => {
            const buyer = item.buyer!;
            const price = BigInt(item.price_sold || '0');
            volumeByBuyer[buyer] = (volumeByBuyer[buyer] || 0n) + price;
        });

        const topTraders = Object.entries(volumeByBuyer)
            .map(([address, volume]) => ({ address, volume: volume.toString() }))
            .sort((a, b) => Number(BigInt(b.volume) - BigInt(a.volume)))
            .slice(0, 10);

        return NextResponse.json({
            topMiners: topMiners.map(m => ({
                address: m.completer,
                tasksSolved: m._count.task_id
            })),
            topTraders,
        });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
