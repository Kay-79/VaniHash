
import { SuiService } from './services/sui.service';
import { DbService } from './services/db.service';
import { EventParser } from './parsers/event.parser';
import { CONFIG } from './config';

async function main() {
    const suiService = new SuiService();
    const dbService = new DbService();
    const eventParser = new EventParser(dbService, suiService);

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
            // 2. Poll Marketplace Transactions (Filtered by Function Name)
            // Due to RPC strictness, we must poll each function separately if using cursors
            if (CONFIG.MARKETPLACE_PACKAGE_ID) {
                const chunks = ['list', 'delist', 'purchase'];

                for (const func of chunks) {
                    const cursorKey = `market_tx_cursor_${func}`;
                    let marketTxCursor = await dbService.getCursor(cursorKey)
                        .then(c => c ? c.tx_digest : undefined);

                    const marketTxs = await suiService.queryTransactionBlocks(
                        CONFIG.MARKETPLACE_PACKAGE_ID,
                        CONFIG.MODULE_MARKET,
                        func,
                        marketTxCursor || undefined
                    );

                    for (const tx of marketTxs.data) {
                        if (tx.events) {
                            for (const event of tx.events) {
                                await eventParser.parse(event, tx.timestampMs);
                            }
                        }
                    }

                    if (marketTxs.hasNextPage && marketTxs.nextCursor) {
                        marketTxCursor = marketTxs.nextCursor;
                        await dbService.saveCursor(cursorKey, marketTxCursor!, '0');
                    } else if (marketTxs.data.length > 0) {
                        const lastTx = marketTxs.data[marketTxs.data.length - 1];
                        marketTxCursor = lastTx.digest;
                        await dbService.saveCursor(cursorKey, marketTxCursor!, '0');
                    }
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
