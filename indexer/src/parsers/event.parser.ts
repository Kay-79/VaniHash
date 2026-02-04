
import { DbService } from '../services/db.service';

export class EventParser {
    constructor(private db: DbService) { }

    async parse(event: any) {
        const eventType = event.type;
        const parsedJson = event.parsedJson;
        const txDigest = event.id.txDigest;
        const timestampMs = BigInt(event.timestampMs);

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
                await this.db.createListing({
                    listing_id: parsedJson.id,
                    seller: parsedJson.kiosk,
                    price: parsedJson.price,
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
