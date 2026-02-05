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
                    bytecode: parsedJson.bytecode ? Buffer.from(parsedJson.bytecode).toString('base64') : null, // Convert u8[] to Base64
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

            } else if (eventType.includes('::kiosk::ItemListed')) {
                // Handle Standard Kiosk Listing (Filtered by Transaction Source)

                // Fetch Object Display
                let imageUrl = '';
                try {
                    const obj = await this.suiService.getObject(parsedJson.id);
                    /* console.log(`[EventParser] Fetched object ${parsedJson.id}:`, JSON.stringify(obj.data?.content, null, 2)); */
                    const display = obj.data?.display?.data;
                    if (display && typeof display === 'object' && 'image_url' in display) {
                        imageUrl = String(display.image_url);
                    } else {
                        // Fallback to Content Fields (e.g. 'url' or 'image_url')
                        const content = obj.data?.content;
                        if (content && content.dataType === 'moveObject') {
                            const fields = content.fields as any;
                            if (fields) {
                                if ('url' in fields) imageUrl = String(fields.url);
                                else if ('image_url' in fields) imageUrl = String(fields.image_url);
                                else if ('img_url' in fields) imageUrl = String(fields.img_url);

                                console.log(`[EventParser] Extracted fallback image for ${parsedJson.id}: ${imageUrl}`);
                            }
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch display for ${parsedJson.id}`, e);
                }

                console.log(`[EventParser] Upserting listing ${parsedJson.id} with image: ${imageUrl}`);

                await this.db.createListing({
                    listing_id: parsedJson.id,
                    seller: event.sender, // The transaction sender is the seller (owner of the Kiosk/Auth)
                    kiosk_id: parsedJson.kiosk, // The Kiosk ID from the event
                    price: parsedJson.price,
                    image_url: imageUrl,
                    type: eventType,
                    status: 'ACTIVE',
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });

            } else if (eventType.includes('::kiosk::ItemPurchased')) {
                // Handle Standard Kiosk Purchase (Filtered by Transaction Source)
                await this.db.updateListing(parsedJson.id, {
                    status: 'SOLD',
                    buyer: event.sender,
                    price_sold: parsedJson.price,
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });

            } else if (eventType.includes('::kiosk::ItemDelisted')) {
                // Handle Standard Kiosk Delisting (Filtered by Transaction Source)
                await this.db.updateListing(parsedJson.id, {
                    status: 'DELISTED',
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
