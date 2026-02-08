
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

            // 2. Poll Marketplace Events
            if (CONFIG.MARKETPLACE_PACKAGE_ID) {
                const cursorKey = 'market_event_cursor';
                const marketCursorData = await dbService.getCursor(cursorKey);
                let marketCursor = marketCursorData
                    ? { txDigest: marketCursorData.tx_digest!, eventSeq: marketCursorData.event_seq! }
                    : undefined;

                const marketEvents = await suiService.queryEvents(
                    CONFIG.MARKETPLACE_PACKAGE_ID,
                    'escrow',
                    marketCursor
                );

                // Process Marketplace Events
                for (const event of marketEvents.data) {
                    await eventParser.parse(event);
                }

                // Update Cursor
                if (marketEvents.hasNextPage && marketEvents.nextCursor) {
                    marketCursor = marketEvents.nextCursor;
                    await dbService.saveCursor(cursorKey, marketCursor!.txDigest, marketCursor!.eventSeq);
                } else if (marketEvents.data.length > 0) {
                    const lastEvent = marketEvents.data[marketEvents.data.length - 1];
                    marketCursor = { txDigest: lastEvent.id.txDigest, eventSeq: lastEvent.id.eventSeq };
                    await dbService.saveCursor(cursorKey, marketCursor!.txDigest, marketCursor!.eventSeq);
                }
            }

            // 3. Poll Bids Events (Separate cursor for Bids module)
            if (CONFIG.MARKETPLACE_PACKAGE_ID) {
                const cursorKey = 'bids_cursor';
                const bidsCursorData = await dbService.getCursor(cursorKey);
                let bidsCursor = bidsCursorData
                    ? { txDigest: bidsCursorData.tx_digest!, eventSeq: bidsCursorData.event_seq! }
                    : undefined;

                const bidsEvents = await suiService.queryEvents(
                    CONFIG.MARKETPLACE_PACKAGE_ID,
                    'bids',
                    bidsCursor
                );

                // Process Bids Events
                for (const event of bidsEvents.data) {
                    await eventParser.parse(event);
                }

                // Update Cursor
                if (bidsEvents.hasNextPage && bidsEvents.nextCursor) {
                    bidsCursor = bidsEvents.nextCursor;
                    await dbService.saveCursor(cursorKey, bidsCursor!.txDigest, bidsCursor!.eventSeq);
                } else if (bidsEvents.data.length > 0) {
                    const lastEvent = bidsEvents.data[bidsEvents.data.length - 1];
                    bidsCursor = { txDigest: lastEvent.id.txDigest, eventSeq: lastEvent.id.eventSeq };
                    await dbService.saveCursor(cursorKey, bidsCursor!.txDigest, bidsCursor!.eventSeq);
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
