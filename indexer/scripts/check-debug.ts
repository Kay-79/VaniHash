
async function main() {
    const configId = '0x28e5ad3bf07ccedf4239f6cf54025644c9a8efba0555b8e52093f332c92f8279';
    const txDigest = 'CmpxSGox4J2NF6o9owGwGAMQJy4FrvdqR1Mu3wyyE2us';
    const url = 'https://fullnode.testnet.sui.io:443';

    console.log(`Checking Config: ${configId}`);

    // Check Config
    const configRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'sui_getObject',
            params: [
                configId,
                { showType: true, showContent: true }
            ]
        })
    }).then(r => r.json());

    if (configRes.error) {
        console.error('Config Error:', configRes.error);
    } else {
        console.log('Config Type:', configRes.result?.data?.type);
    }

    console.log(`\nChecking Transaction for Listing details: ${txDigest}`);
    // Check Tx
    const txRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'sui_getTransactionBlock',
            params: [
                txDigest,
                { showEvents: true }
            ]
        })
    }).then(r => r.json());

    if (txRes.error) {
        console.error('Tx Error:', txRes.error);
        return;
    }

    const events = txRes.result?.events || [];
    const listedEvent = events.find((e: any) => e.type.includes('ItemListed'));

    if (listedEvent) {
        console.log('Listed Event:', JSON.stringify(listedEvent, null, 2));
        const listingId = listedEvent.parsedJson.listing_id || listedEvent.parsedJson.listingId;
        console.log(`\nChecking Listing Object: ${listingId}`);

        const listingRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 3,
                method: 'sui_getObject',
                params: [
                    listingId,
                    { showType: true, showContent: true }
                ]
            })
        }).then(r => r.json());

        if (listingRes.error) {
            console.error('Listing Object Error:', listingRes.error);
        } else {
            console.log('Listing Object Type:', listingRes.result?.data?.type);
        }
    } else {
        console.log('No ItemListed event found in transaction.');
    }
}

main();
