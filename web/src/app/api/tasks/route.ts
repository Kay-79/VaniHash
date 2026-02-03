import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const creator = searchParams.get('creator');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const where: any = {};

        if (status && status !== 'ALL') {
            // Support comma-separated statuses e.g. "ACTIVE,PENDING"
            const statuses = status.split(',');
            where.status = { in: statuses };
        }

        if (creator) {
            where.creator = creator;
        }

        if (search) {
            where.OR = [
                { pattern: { contains: search, mode: 'insensitive' } },
                { task_id: { contains: search, mode: 'insensitive' } },
            ];
        }

        const tasks = await prisma.task.findMany({
            where,
            orderBy: { timestamp_ms: 'desc' },
            take: limit,
            skip: offset,
        });

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
