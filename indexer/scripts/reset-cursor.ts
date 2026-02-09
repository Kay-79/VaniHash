
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("Resetting indexer cursor...");

    try {
        // Delete all cursors to force re-indexing
        const result = await prisma.cursor.deleteMany({});
        console.log(`Deleted ${result.count} cursors.`);

        // Optionally, clear other tables if a full re-index is desired
        // await prisma.task.deleteMany({});
        // await prisma.listing.deleteMany({});
        // console.log("Cleared tasks and listings.");

        console.log("Indexer cursor reset successfully. Restart the indexer to begin changes.");
    } catch (e) {
        console.error("Error resetting cursor:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
