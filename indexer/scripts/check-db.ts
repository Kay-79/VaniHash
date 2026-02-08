
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const listingId = '0xe11615b0fc279f3662b77397bf13979a0222c5911e7e4b0a45cff03c0d3cdfc9';
    console.log(`Checking DB for listing: ${listingId}`);

    const listing = await prisma.listing.findUnique({
        where: { listing_id: listingId }
    });

    if (!listing) {
        console.log('Listing NOT FOUND in DB');
    } else {
        console.log('Listing FOUND:', listing);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
