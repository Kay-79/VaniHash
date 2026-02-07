
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const listingId = '0x72002e72a72b6098b05f251752156ccb42ac428ce2cfb69cb2eac43653219063';
    const correctType = '0x0e9eeb64deb8b10b20de2b93b083b2a90f4e38004debdfe3b2f39384c8b08a74::admin::AdminCap';

    console.log(`Fixing Listing Type: ${listingId}`);

    const result = await prisma.listing.update({
        where: { listing_id: listingId },
        data: { type: correctType }
    });

    console.log('Updated Listing:', result);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
