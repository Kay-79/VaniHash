import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log(`Checking Recent Listings...`);

    const listings = await prisma.listing.findMany({
        take: 5,
        orderBy: { created_at: 'desc' }
    });

    console.log('--- Listings ---');
    listings.forEach(l => {
        console.log(`Listing: ${l.listing_id}`);
        console.log(`Item:    ${l.item_id}`);
        console.log(`Type:    ${l.type}`);
        console.log(`Status:  ${l.status}`);
        console.log(`Time:    ${l.timestamp_ms}`);
        console.log('---');
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
