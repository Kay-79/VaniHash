
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Resetting Cursors...');
    const deleted = await prisma.cursor.deleteMany({});
    console.log(`Deleted ${deleted.count} cursors.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
