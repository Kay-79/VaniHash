
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';

const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl('testnet') });

async function checkObject() {
    const id = '0xa6eba60bac272499d690a6f47702f2603ca85a36322b781ce7db7543501a43a0';
    console.log(`Checking object ${id}...`);

    try {
        const obj = await client.getObject({
            id,
            options: {
                showType: true,
                showContent: true,
                showOwner: true,
            }
        });

        if (obj.error) {
            console.log('Object Error:', obj.error);
        } else {
            console.log('Object Status:', obj.data ? 'Exists' : 'Deleted/Missing');
            console.log('Object Type:', obj.data?.type);
            console.log('Owner:', obj.data?.owner);
        }

    } catch (e) {
        console.error('Error fetching object:', e);
    }
}

checkObject();
