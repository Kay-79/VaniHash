import { DbService } from '../services/db.service';

import { SuiService } from '../services/sui.service';

export class EventParser {
    constructor(private db: DbService, private suiService: SuiService) { }

    async parse(event: any, manualTimestampMs?: string | number) {
        const eventType = event.type;
        const parsedJson = event.parsedJson;
        const txDigest = event.id.txDigest;
        const timestampMs = BigInt(event.timestampMs || manualTimestampMs || 0);

        console.log(`Processing event: ${eventType} from tx ${txDigest}`);

        try {
            if (eventType.includes('::TaskCreated')) {
                await this.db.createTask({
                    task_id: parsedJson.task_id,
                    creator: parsedJson.creator,
                    reward_amount: parsedJson.reward_amount,
                    prefix: parsedJson.prefix || '',
                    suffix: parsedJson.suffix || '',
                    contains: parsedJson.contain || '', // Map 'contain' (event) to 'contains' (DB)
                    task_type: Number(parsedJson.task_type), // Schema expects Int
                    target_type: parsedJson.target_type,
                    difficulty: parsedJson.difficulty,
                    status: 'ACTIVE',
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs,
                    lock_duration_ms: parsedJson.lock_duration_ms ? BigInt(parsedJson.lock_duration_ms) : BigInt(0),
                    // Bytecode removed from schema
                });

            } else if (eventType.includes('::TaskCompleted')) {
                await this.db.updateTask(parsedJson.task_id, {
                    status: 'COMPLETED',
                    completer: parsedJson.solver || parsedJson.completer || parsedJson.miner,
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });

            } else if (eventType.includes('::TaskCancelled')) {
                await this.db.updateTask(parsedJson.task_id, {
                    status: 'CANCELLED',
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });

            } else if (eventType.includes('::escrow::ItemListed')) {
                // Handle Escrow Listing
                const itemId = parsedJson.item_id;
                const listingId = parsedJson.listing_id;

                // Fetch Listing Object to get wrapped item type and content
                let imageUrl = '';
                let itemType = '';

                try {
                    const obj = await this.suiService.getObject(listingId);

                    if (obj.data?.type) {
                        const match = obj.data.type.match(/Listing<(.+)>/);
                        if (match) {
                            itemType = match[1];
                        }
                    }

                    // Extract Image URL from wrapped item fields
                    if (obj.data?.content?.dataType === 'moveObject') {
                        const fields = obj.data.content.fields as any;
                        const itemFields = fields?.item?.fields;

                        if (itemFields) {
                            if ('url' in itemFields) imageUrl = String(itemFields.url);
                            else if ('image_url' in itemFields) imageUrl = String(itemFields.image_url);
                            else if ('img_url' in itemFields) imageUrl = String(itemFields.img_url);
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch listing data for ${listingId}`, e);
                }

                console.log(`[EventParser] Upserting listing ${parsedJson.listing_id} for item ${itemId} (Type: ${itemType})`);

                if (!itemType) {
                    throw new Error(`Failed to extract item type for listing ${parsedJson.listing_id} (Item: ${itemId})`);
                }

                await this.db.createListing({
                    listing_id: parsedJson.listing_id,
                    item_id: itemId,
                    seller: parsedJson.seller,

                    price: parsedJson.price,
                    image_url: imageUrl,
                    type: itemType, // Must be valid
                    status: 'ACTIVE',
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });
            } else if (eventType.includes('::escrow::ItemPurchased')) {
                // Handle Escrow Purchase
                await this.db.updateListing(parsedJson.listing_id, {
                    status: 'SOLD',
                    buyer: parsedJson.buyer,
                    price_sold: parsedJson.price,
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });

            } else if (eventType.includes('::escrow::ItemDelisted')) {
                // Handle Escrow Delisting
                await this.db.updateListing(parsedJson.listing_id, {
                    status: 'DELISTED',
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });

            } else if (eventType.includes('::bids::BidCreated')) {
                await this.db.createBid({
                    bid_id: parsedJson.bid_id,
                    listing_id: parsedJson.listing_id,
                    bidder: parsedJson.bidder,
                    amount: parsedJson.amount,
                    status: 'ACTIVE',
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });

            } else if (eventType.includes('::bids::BidAccepted')) {
                await this.db.updateBid(parsedJson.bid_id, {
                    status: 'ACCEPTED',
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });

            } else if (eventType.includes('::bids::BidCancelled')) {
                await this.db.updateBid(parsedJson.bid_id, {
                    status: 'CANCELLED',
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });

            } else if (eventType.includes('::bids::OfferCreated')) {
                await this.db.createOffer({
                    offer_id: parsedJson.offer_id,
                    item_id: parsedJson.item_id,
                    offerer: parsedJson.offerer,
                    amount: parsedJson.amount,
                    status: 'ACTIVE',
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });

            } else if (eventType.includes('::bids::OfferAccepted')) {
                await this.db.updateOffer(parsedJson.offer_id, {
                    status: 'ACCEPTED',
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });

            } else if (eventType.includes('::bids::OfferCancelled')) {
                await this.db.updateOffer(parsedJson.offer_id, {
                    status: 'CANCELLED',
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });
            }
        } catch (e: any) {
            // Ignore duplicate entry errors (idempotency)
            if (e.code !== 'P2002') {
                console.error(`Error processing event ${eventType}:`, e);
            } else {
                console.warn(`Duplicate event ignored: ${eventType} ${txDigest}`);
            }
        }
    }
}
