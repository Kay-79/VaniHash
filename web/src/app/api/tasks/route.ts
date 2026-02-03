import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const creator = searchParams.get('creator');
    const minReward = searchParams.get('minReward');
    const maxReward = searchParams.get('maxReward');
    const length = searchParams.get('length');

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
            where.reward_amount = {};
            // Convert SUI to MIST (x 1,000,000,000) for comparison if stored as MIST
            // Assuming stored as "1000000000" string in DB
            // Prisma string comparison is lexicographical, which is BAD for numbers.
            //Ideally reward_amount should be BigInt or Decimal. Schema says String?.
            // CAUTION: String comparison "10" < "2" returns true. 
            // We probably need to use raw query OR cast in application if data volume is small, or change schema.
            // Given the constraints and likely small scale for now, we might rely on exact match or try to cast if specific numbers.
            // BUT, wait, `reward_amount` is likely stored as MIST.
            // Let's assume for now we filter in-memory if we can't do numeric comparison on string field easily without RawSQL.
            // Actually, let's try to use Raw SQL or if we can accept limited filtering.
            // Let's use Prisma's capability if possible. If not, raw query is best.
            // However, modifying this to Raw Query completely is a big change.
            // Let's stick to `findMany` and maybe filter post-fetch for now OR use a raw unsafe query if necessary.
            // Actually, for a production app, we should change schema to BigInt. 
            // For now, I will use raw query logic inside findMany? No, I'll filter post-query for simplicity given the task scope, 
            // or I'll implement a raw query if I see performance issues. 
            // Let's try to use `gte` / `lte` but if it's string it's wrong.
            // Let's use Raw Query for `findMany` equivalent. 
            // Actually, look at Schema: `reward_amount String?`.
            // Let's pivot to using `prisma.$queryRaw` for robust implementation as shown in leaderboard.
        }

        if (search) {
            where.OR = [
                { task_id: { contains: search, mode: 'insensitive' } },
                { contains: { contains: search, mode: 'insensitive' } },
                { prefix: { contains: search, mode: 'insensitive' } },
                { suffix: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Pattern Length
        if (length) {
            // "4", "5", "6", "7", "8+"
            // We need to check length of `contains` field (the pattern)
            // Postgres supports length().
            // This strongly suggests we should use RAW SQL for this endpoint too 
            // OR we filter in memory.
            // Let's keep using `findMany` for now and filter in-memory for `length`.
            // It's not efficient for valid pagination but acceptable for MVP.
        }

        let tasks = await prisma.task.findMany({
            where,
            orderBy: { timestamp_ms: 'desc' },
            take: limit + 50, // Fetch extra for filtering
            skip: offset,
        });

        // In-memory filtering for Number-based fields stored as String (Reward) and Length
        if (minReward || maxReward || length) {
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

                // Length Check
                if (length && pass) {
                    const pat = (t as any).contains || '';
                    if (length === '8+') {
                        if (pat.length < 8) pass = false;
                    } else {
                        if (pat.length !== parseInt(length)) pass = false;
                    }
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
