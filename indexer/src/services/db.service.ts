
import { PrismaClient } from '@prisma/client';

export class DbService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getCursor(id: string) {
        return this.prisma.cursor.findUnique({ where: { id } });
    }

    async saveCursor(id: string, txDigest: string, eventSeq: string) {
        return this.prisma.cursor.upsert({
            where: { id },
            update: { tx_digest: txDigest, event_seq: eventSeq },
            create: { id, tx_digest: txDigest, event_seq: eventSeq }
        });
    }

    // --- Task Operations ---
    async createTask(data: any) {
        return this.prisma.task.create({ data });
    }

    async updateTask(taskId: string, data: any) {
        return this.prisma.task.update({ where: { task_id: taskId }, data });
    }

    // --- Listing Operations ---
    async createListing(data: any) {
        return this.prisma.listing.create({ data });
    }

    async updateListing(listingId: string, data: any) {
        return this.prisma.listing.update({ where: { listing_id: listingId }, data });
    }

    // --- Bid Operations ---
    // (Add when Schema supports Bids)
}
