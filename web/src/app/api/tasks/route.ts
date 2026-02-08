import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const creator = searchParams.get('creator');
    const minReward = searchParams.get('minReward');
    const maxReward = searchParams.get('maxReward');
    const itemType = searchParams.get('itemType');

    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const where: any = {};

        if (status && status !== 'ALL') {
            const statuses = status.split(',');
            where.status = { in: statuses };
        }

        if (creator) {
            where.creator = creator;
        }

        // Reward Filter (SUI)
        if (minReward || maxReward) {
            // ... kept reward logic comment ...
        }

        if (search) {
            where.OR = [
                { task_id: { contains: search, mode: 'insensitive' } },
                { contains: { contains: search, mode: 'insensitive' } },
                { prefix: { contains: search, mode: 'insensitive' } },
                { suffix: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Item Type Filter (using target_type)
        if (itemType) {
            if (itemType === 'GasObject') {
                where.target_type = { contains: 'coin::Coin' };
            } else if (itemType === 'Package') {
                where.target_type = { contains: 'UpgradeCap' };
            } else {
                where.target_type = { contains: itemType };
            }
        }

        let tasks = await prisma.task.findMany({
            where,
            orderBy: { timestamp_ms: 'desc' },
            take: limit + 50, // Fetch extra for filtering
            skip: offset,
        });

        // In-memory filtering for Number-based fields stored as String (Reward)
        if (minReward || maxReward) {
            tasks = tasks.filter(t => {
                let pass = true;

                // Reward Check
                if (minReward || maxReward) {
                    const val = BigInt((t as any).reward_amount || '0');
                    const min = minReward ? BigInt(parseFloat(minReward) * 1e9) : BigInt(0);
                    const max = maxReward ? BigInt(parseFloat(maxReward) * 1e9) : null;

                    if (val < min) pass = false;
                    if (max && val > max) pass = false;
                }

                return pass;
            });
            // Re-slice for limit after filtering
            tasks = tasks.slice(0, limit);
        }

        // Convert BigInt to string for JSON serialization
        const serialized = JSON.parse(JSON.stringify(tasks, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // Add miner alias for each task
        const enriched = serialized.map((t: any) => ({
            ...t,
            miner: t.completer
        }));

        return NextResponse.json(enriched);
    } catch (e) {
        console.error("API /api/tasks error:", e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
