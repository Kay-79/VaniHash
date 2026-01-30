import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express, { Request, Response } from 'express';
import cors from 'cors';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PACKAGE_ID = process.env.VANIHASH_PACKAGE_ID || '0xa4f12914ac23fdd5f926be69a1392714fdd192a3e457b8665e3e78210db3171d';
const MODULE_NAME = 'vanihash';
const NETWORK = process.env.SUI_NETWORK || 'testnet';
const PORT = process.env.PORT || 3000;

// Database Init
async function initDb(): Promise<Database> {
    const db = await open({
        filename: path.join(__dirname, '..', 'vanihash.db'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT UNIQUE,
            creator TEXT,
            reward_amount TEXT,
            pattern TEXT,
            status TEXT,
            tx_digest TEXT,
            timestamp_ms INTEGER
        );
        CREATE TABLE IF NOT EXISTS cursors (
            id TEXT PRIMARY KEY,
            tx_digest TEXT,
            event_seq TEXT
        );
        CREATE TABLE IF NOT EXISTS listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            listing_id TEXT UNIQUE,
            seller TEXT,
            price TEXT,
            type TEXT,
            status TEXT,
            tx_digest TEXT,
            timestamp_ms INTEGER
        );
    `);

    return db;
}

// API Server
function startApi(db: Database) {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get('/tasks', async (req: Request, res: Response) => {
        try {
            const { status, limit = 50, offset = 0 } = req.query;
            let query = 'SELECT * FROM tasks';
            let params: any[] = [];

            if (status) {
                query += ' WHERE status = ?';
                params.push(status);
            }

            query += ' ORDER BY timestamp_ms DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const tasks = await db.all(query, params);
            res.json(tasks);
        } catch (e) {
            res.status(500).json({ error: (e as Error).message });
        }
    });

    app.get('/tasks/:id', async (req: Request, res: Response) => {
        try {
            const task = await db.get('SELECT * FROM tasks WHERE task_id = ?', [req.params.id]);
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.json(task);
        } catch (e) {
            res.status(500).json({ error: (e as Error).message });
        }
    });

    app.get('/listings', async (req: Request, res: Response) => {
        try {
            const { status = 'ACTIVE' } = req.query;
            const listings = await db.all('SELECT * FROM listings WHERE status = ? ORDER BY timestamp_ms DESC', [status]);
            res.json(listings);
        } catch (e) {
            res.status(500).json({ error: (e as Error).message });
        }
    });

    app.listen(PORT, () => {
        console.log(`API Server running on port ${PORT}`);
    });
}

// Main Indexer Loop
async function main() {
    console.log(`Initializing DB...`);
    const db = await initDb();
    startApi(db); 

    const rpcUrl = getJsonRpcFullnodeUrl(NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet');
    console.log(`Connecting to Sui Network: ${rpcUrl}`);
    
    // Note: SuiJsonRpcClient needs 'url' and 'network' in options
    const client = new SuiJsonRpcClient({ 
        url: rpcUrl,
        network: NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet' 
    });

    console.log(`Starting Indexer for package: ${PACKAGE_ID} on ${NETWORK}`);

    let cursorRecord = await db.get('SELECT tx_digest, event_seq FROM cursors WHERE id = ?', ['main_cursor']);
    let nextCursor = cursorRecord ? { txDigest: cursorRecord.tx_digest, eventSeq: cursorRecord.event_seq } : undefined;

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
                    const existing = await db.get('SELECT id FROM tasks WHERE task_id = ?', [parsedJson.task_id]);
                    if (!existing) {
                        await db.run(
                            `INSERT INTO tasks (task_id, creator, reward_amount, pattern, status, tx_digest, timestamp_ms)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [parsedJson.task_id, parsedJson.creator, parsedJson.reward_amount, parsedJson.pattern, 'ACTIVE', txDigest, timestampMs]
                        );
                    }
                } else if (eventType.includes('::TaskCompleted')) {
                    await db.run(
                        `UPDATE tasks SET status = ?, tx_digest = ?, timestamp_ms = ? WHERE task_id = ?`,
                        ['COMPLETED', txDigest, timestampMs, parsedJson.task_id]
                    );
                } else if (eventType.includes('::TaskCancelled')) {
                    await db.run(
                        `UPDATE tasks SET status = ?, tx_digest = ?, timestamp_ms = ? WHERE task_id = ?`,
                        ['CANCELLED', txDigest, timestampMs, parsedJson.task_id]
                    );
                } else if (eventType.includes('::marketplace::ItemListed')) {
                    await db.run(
                        `INSERT INTO listings (listing_id, seller, price, type, status, tx_digest, timestamp_ms)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [parsedJson.listing_id, parsedJson.seller, parsedJson.price, eventType, 'ACTIVE', txDigest, timestampMs]
                    );
                } else if (eventType.includes('::marketplace::ItemSold')) {
                    await db.run(
                         `UPDATE listings SET status = ?, tx_digest = ?, timestamp_ms = ? WHERE listing_id = ?`,
                         ['SOLD', txDigest, timestampMs, parsedJson.listing_id]
                    );
                } else if (eventType.includes('::marketplace::ItemDelisted')) {
                    await db.run(
                         `UPDATE listings SET status = ?, tx_digest = ?, timestamp_ms = ? WHERE listing_id = ?`,
                         ['DELISTED', txDigest, timestampMs, parsedJson.listing_id]
                    );
                }
            }

            if (events.hasNextPage && events.nextCursor) {
                const nc = events.nextCursor;
                nextCursor = nc;
                await db.run(
                    `INSERT OR REPLACE INTO cursors (id, tx_digest, event_seq) VALUES (?, ?, ?)`,
                    ['main_cursor', nc.txDigest, nc.eventSeq]
                );
            }
        } catch (e) {
            console.error('Error fetching events:', e);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

main().catch(console.error);
