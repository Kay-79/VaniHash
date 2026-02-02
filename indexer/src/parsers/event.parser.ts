
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
                    contain: parsedJson.contain || '',
                    task_type: parsedJson.task_type === 1 ? 'PACKAGE' : 'OBJECT',
                    target_type: parsedJson.target_type,
                    difficulty: parsedJson.difficulty,
                    status: 'ACTIVE',
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs,
                });

            } else if (eventType.includes('::TaskCompleted')) {
                await this.db.updateTask(parsedJson.task_id, {
                    status: 'COMPLETED',
                    completer: parsedJson.solver || parsedJson.completer,
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
                // Handle Standard Kiosk Listing
                await this.db.createListing({
                    listing_id: parsedJson.id, // Kiosk uses 'id'
                    seller: parsedJson.kiosk,  // Kiosk ID acts as seller reference
                    price: parsedJson.price,
                    type: eventType,
                    status: 'ACTIVE',
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });

            } else if (eventType.includes('::kiosk::ItemPurchased')) {
                // Handle Standard Kiosk Purchase
                await this.db.updateListing(parsedJson.id, {
                    status: 'SOLD',
                    buyer: event.sender, // Buyer is the transaction sender
                    price_sold: parsedJson.price,
                    tx_digest: txDigest,
                    timestamp_ms: timestampMs
                });

            } else if (eventType.includes('::kiosk::ItemDelisted')) {
                // Handle Standard Kiosk Delisting
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
