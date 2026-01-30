import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const where = status ? { status } : {};
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

        return NextResponse.json(serialized);
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
