
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
        return this.prisma.listing.upsert({
            where: { listing_id: data.listing_id },
            update: data,
            create: data
        });
    }

    async updateListing(listingId: string, data: any) {
        return this.prisma.listing.update({ where: { listing_id: listingId }, data });
    }

    // --- Bid Operations ---
    async createBid(data: any) {
        return this.prisma.bid.upsert({
            where: { bid_id: data.bid_id },
            update: data,
            create: data
        });
    }

    async updateBid(bidId: string, data: any) {
        return this.prisma.bid.update({ where: { bid_id: bidId }, data });
    }

    // --- Offer Operations ---
    async createOffer(data: any) {
        return this.prisma.offer.upsert({
            where: { offer_id: data.offer_id },
            update: data,
            create: data
        });
    }

    async updateOffer(offerId: string, data: any) {
        return this.prisma.offer.update({ where: { offer_id: offerId }, data });
    }
}
