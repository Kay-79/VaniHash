
import dotenv from 'dotenv';
dotenv.config();

import { SuiService } from './src/services/sui.service';
import { DbService } from './src/services/db.service';
import { EventParser } from './src/parsers/event.parser';
import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

async function manualIndex() {
    const digest = 'Hk4FRDH9Zq9yBJu2WYZuJEVV5PsxFFudaHCbdh8Gddt5';
    console.log(`Manual indexing for transaction ${digest}...`);

    const dbService = new DbService();
    const suiService = new SuiService();
    const eventParser = new EventParser(dbService, suiService);

    const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl('testnet') });

    try {
        const tx = await client.getTransactionBlock({
            digest,
            options: {
                showEvents: true,
                showEffects: true
            }
        });

        if (!tx.events || tx.events.length === 0) {
            console.log('No events found in transaction.');
            return;
        }

        const timestampMs = tx.timestampMs;
        console.log(`Transaction timestamp: ${timestampMs}`);

        for (const event of tx.events) {
            console.log(`Processing event: ${event.type}`);

            // Construct event object compatible with EventParser
            // EventParser needs: type, parsedJson, id: { txDigest }, timestampMs
            // returned event from getTransactionBlock has: type, parsedJson, id (maybe? or likely implicit in tx)
            // Wait, event structure from getTransactionBlock usually has 'id' field which contains { txDigest, eventSeq }

            // Let's ensure 'id' exists. If not, construct it.
            // But we can check event keys in runtime loop or just force it.

            const eventId = (event as any).id || { txDigest: digest, eventSeq: '0' }; // fallback if needed

            const mockEvent = {
                type: event.type,
                parsedJson: event.parsedJson,
                id: eventId,
                timestampMs: timestampMs
            };

            await eventParser.parse(mockEvent, timestampMs);
        }

        console.log('Manual indexing completed.');

    } catch (e) {
        console.error('Error during manual indexing:', e);
    }
}

manualIndex();
