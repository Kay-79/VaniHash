const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();

        console.log('Dropping tables...');
        // Drop tables with CASCADE to handle foreign keys if any
        await client.query('DROP TABLE IF EXISTS "tasks" CASCADE;');
        await client.query('DROP TABLE IF EXISTS "listings" CASCADE;');
        await client.query('DROP TABLE IF EXISTS "cursors" CASCADE;');
        await client.query('DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;');

        console.log('Tables dropped successfully.');
    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
    }
}

main();
