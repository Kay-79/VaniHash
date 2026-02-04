
import { SuiService } from './services/sui.service';
import { DbService } from './services/db.service';
import { EventParser } from './parsers/event.parser';
import { CONFIG } from './config';

async function main() {
    const suiService = new SuiService();
    const dbService = new DbService();
    const eventParser = new EventParser(dbService);

    console.log(`Starting Indexer Service...`);
    console.log(`VaniHash Package: ${CONFIG.VANIHASH_PACKAGE_ID}`);
    if (CONFIG.MARKETPLACE_PACKAGE_ID) {
        console.log(`Marketplace Package: ${CONFIG.MARKETPLACE_PACKAGE_ID}`);
    } else {
        console.warn('MARKETPLACE_PACKAGE_ID is not set in config/env. Marketplace events will be skipped until set.');
    }

    // Initialize cursor
    let nextCursor = await dbService.getCursor('main_cursor')
        .then(c => c ? { txDigest: c.tx_digest!, eventSeq: c.event_seq! } : undefined);

    while (true) {
        try {
            // We need to query for both packages if they exist.
            // Sui API allows querying by module. We can't query multiple packages in one call efficiently unless we use separate queries or a more complex query if supported.
            // For simplicity, let's query VaniHash first. 
            // Better approach: If we want strict ordering, we might need to query them separately and merge, or just sequential.
            // Given the volume, sequential polling is fine.

            // 1. Poll VaniHash Events
            const vaniHashEvents = await suiService.queryEvents(
                CONFIG.VANIHASH_PACKAGE_ID,
                CONFIG.MODULE_VANIHASH,
                nextCursor
            );

            // Process VaniHash Events
            for (const event of vaniHashEvents.data) {
                await eventParser.parse(event);
            }

            // Update Cursor based on VaniHash Events
            if (vaniHashEvents.hasNextPage && vaniHashEvents.nextCursor) {
                nextCursor = vaniHashEvents.nextCursor;
                await dbService.saveCursor('main_cursor', nextCursor!.txDigest, nextCursor!.eventSeq);
            } else if (vaniHashEvents.data.length > 0) {
                const lastEvent = vaniHashEvents.data[vaniHashEvents.data.length - 1];
                nextCursor = { txDigest: lastEvent.id.txDigest, eventSeq: lastEvent.id.eventSeq };
                await dbService.saveCursor('main_cursor', nextCursor!.txDigest, nextCursor!.eventSeq);
            }

            // 2. Poll Marketplace Events (Use a separate cursor? Or share if on same sequence? Sui cursors are specific to the query.)
            // IMPORTANT: If we query different packages, we CANNOT use the same cursor object, as the cursor is tied to the result set of the specific query.
            // We need a separate cursor for Marketplace.

            // 2. Poll Marketplace Transactions (Filtered by Module Interaction)
            if (CONFIG.MARKETPLACE_PACKAGE_ID) {
                let marketTxCursor = await dbService.getCursor('market_tx_cursor')
                    .then(c => c ? c.tx_digest : undefined); // Txs cursor is often just a digest/string in SDK depending on version, check Type. 
                // Actually queryTransactionBlocks cursor is string (txDigest).

                // Use the new queryTransactionBlocks method
                const marketTxs = await suiService.queryTransactionBlocks(
                    CONFIG.MARKETPLACE_PACKAGE_ID,
                    CONFIG.MODULE_MARKET,
                    marketTxCursor || undefined
                );

                for (const tx of marketTxs.data) {
                    if (tx.events) {
                        for (const event of tx.events) {
                            // We pass the event to the parser. 
                            // The parser logic for Kiosk events checks the event type string.
                            // Since we are iterating TXs that interacted with OUR market module,
                            // any Kiosk event here is relevant.
                            await eventParser.parse(event);
                        }
                    }
                }

                if (marketTxs.hasNextPage && marketTxs.nextCursor) {
                    marketTxCursor = marketTxs.nextCursor;
                    // We save the cursor. For Txs, we might store it as tx_digest.
                    // dbService.saveCursor expects (id, txDigest, eventSeq). 
                    // Transaction cursor is usually just a string (digest). We can pass 0 or null for eventSeq.
                    await dbService.saveCursor('market_tx_cursor', marketTxCursor!, 0);
                }
            }

            if (vaniHashEvents.data.length === 0) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.POLL_INTERVAL_MS));
            }

        } catch (e) {
            console.error('Error in Indexer Loop:', e);
            await new Promise(resolve => setTimeout(resolve, CONFIG.ERROR_RETRY_MS));
        }
    }
}

main().catch(console.error);
