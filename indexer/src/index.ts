import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PACKAGE_ID = process.env.VANIHASH_PACKAGE_ID || '0xa4f12914ac23fdd5f926be69a1392714fdd192a3e457b8665e3e78210db3171d';
const MODULE_NAME = 'vanihash';
const NETWORK = process.env.SUI_NETWORK || 'testnet';

const prisma = new PrismaClient();

// Main Indexer Loop
async function main() {
    const rpcUrl = getJsonRpcFullnodeUrl(NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet');
    console.log(`Connecting to Sui Network: ${rpcUrl}`);
    
    const client = new SuiJsonRpcClient({ 
        url: rpcUrl,
        network: NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet' 
    });

    console.log(`Starting Indexer for package: ${PACKAGE_ID} on ${NETWORK}`);

    // Get cursor from DB
    const cursorRecord = await prisma.cursor.findUnique({
        where: { id: 'main_cursor' }
    });

    let nextCursor = cursorRecord ? { txDigest: cursorRecord.tx_digest!, eventSeq: cursorRecord.event_seq! } : undefined;

    while (true) {
        try {
            // Poll for events
            const events = await client.queryEvents({
                query: { MoveModule: { package: PACKAGE_ID, module: MODULE_NAME } },
                cursor: nextCursor,
                limit: 50,
                order: 'ascending'
            });

            if (events.data.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                continue;
            }

            console.log(`Fetched ${events.data.length} new events.`);

            for (const event of events.data) {
                const eventType = event.type;
                const parsedJson = event.parsedJson as any;
                const txDigest = event.id.txDigest;
                const timestampMs = Number(event.timestampMs);

                console.log(`Processing event: ${eventType} from tx ${txDigest}`);

                if (eventType.includes('::TaskCreated')) {
                    try {
                        await prisma.task.create({
                            data: {
                                task_id: parsedJson.task_id,
                                creator: parsedJson.creator,
                                reward_amount: parsedJson.reward_amount,
                                pattern: parsedJson.pattern,
                                status: 'ACTIVE',
                                tx_digest: txDigest,
                                timestamp_ms: BigInt(timestampMs),
                            }
                        });
                    } catch (e: any) {
                        if (e.code !== 'P2002') console.error('Error inserting task:', e);
                    }

                } else if (eventType.includes('::TaskCompleted')) {
                    await prisma.task.update({
                        where: { task_id: parsedJson.task_id },
                        data: {
                            status: 'COMPLETED',
                            completer: parsedJson.solver, // or parsedJson.completer, checking Move contract would be ideal, but assuming standard name
                            tx_digest: txDigest,
                            timestamp_ms: BigInt(timestampMs)
                        }
                    });

                } else if (eventType.includes('::TaskCancelled')) {
                    await prisma.task.update({
                        where: { task_id: parsedJson.task_id },
                        data: {
                            status: 'CANCELLED',
                            tx_digest: txDigest,
                            timestamp_ms: BigInt(timestampMs)
                        }
                    });

                } else if (eventType.includes('::marketplace::ItemListed')) {
                    try {
                        await prisma.listing.create({
                            data: {
                                listing_id: parsedJson.listing_id,
                                seller: parsedJson.seller,
                                price: parsedJson.price,
                                type: eventType,
                                status: 'ACTIVE',
                                tx_digest: txDigest,
                                timestamp_ms: BigInt(timestampMs)
                            }
                        });
                    } catch (e: any) {
                        if (e.code !== 'P2002') console.error('Error inserting listing:', e);
                    }

                } else if (eventType.includes('::marketplace::ItemSold')) {
                    await prisma.listing.update({
                        where: { listing_id: parsedJson.listing_id },
                        data: {
                            status: 'SOLD',
                            buyer: parsedJson.buyer,
                            price_sold: parsedJson.price,
                            tx_digest: txDigest,
                            timestamp_ms: BigInt(timestampMs)
                        }
                    });

                } else if (eventType.includes('::marketplace::ItemDelisted')) {
                    await prisma.listing.update({
                        where: { listing_id: parsedJson.listing_id },
                        data: {
                            status: 'DELISTED',
                            tx_digest: txDigest,
                            timestamp_ms: BigInt(timestampMs)
                        }
                    });
                }
            }

             if (events.hasNextPage && events.nextCursor) {
                nextCursor = events.nextCursor;
            } else if (events.data.length > 0) {
                const lastEvent = events.data[events.data.length - 1];
                nextCursor = { txDigest: lastEvent.id.txDigest, eventSeq: lastEvent.id.eventSeq };
            }

            if (nextCursor) {
                await prisma.cursor.upsert({
                    where: { id: 'main_cursor' },
                    update: {
                        tx_digest: nextCursor.txDigest,
                        event_seq: nextCursor.eventSeq
                    },
                    create: {
                        id: 'main_cursor',
                        tx_digest: nextCursor.txDigest,
                        event_seq: nextCursor.eventSeq
                    }
                });
            }
        } catch (e) {
            console.error('Error fetching events:', e);
            await new Promise(resolve => setTimeout(resolve, 60000));
        }
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
