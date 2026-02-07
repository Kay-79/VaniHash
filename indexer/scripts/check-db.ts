
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const listingId = '0x72002e72a72b6098b05f251752156ccb42ac428ce2cfb69cb2eac43653219063';
    console.log(`Checking DB for Listing: ${listingId}`);

    const listing = await prisma.listing.findUnique({
        where: { listing_id: listingId }
    });

    console.log('Listing from DB:', listing);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
