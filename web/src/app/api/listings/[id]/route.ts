import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const id = (await params).id;
    try {
        const listing = await prisma.listing.findUnique({
            where: { listing_id: id },
            include: { bids: true },
        });

        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        const serialized = JSON.parse(JSON.stringify(listing, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(serialized);
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
