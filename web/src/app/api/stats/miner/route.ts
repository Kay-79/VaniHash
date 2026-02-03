import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: "Address is required" }, { status: 400 });
        }

        // 1. Total Mined: Count of completed tasks by this address
        const totalMined = await prisma.task.count({
            where: {
                completer: address,
                status: 'COMPLETED'
            }
        });

        // 2. Total Rewards: Sum of reward_amount for completed tasks
        const rewardsQuery = await prisma.$queryRaw`
            SELECT SUM(CAST(reward_amount AS BIGINT)) as "totalRewards"
            FROM tasks
            WHERE completer = ${address} AND status = 'COMPLETED'
        ` as any[];

        const totalRewards = rewardsQuery[0]?.totalRewards || BigInt(0);

        return NextResponse.json({
            address,
            totalMined,
            totalRewards: totalRewards.toString()
        });

    } catch (e) {
        console.error("API /api/stats/miner error:", e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
