import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Delete marketplace cursors so indexer re-scans new package
    const result = await prisma.cursor.deleteMany({
        where: {
            id: { startsWith: "market_" },
        },
    });
    console.log(`Deleted ${result.count} marketplace cursors`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
