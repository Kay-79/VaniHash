
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';

const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl('testnet') });

async function main() {
    const id = '0x0bc95862edcb318472af215783a96f66a09de71cf83c68c4a8395fafc03a880d';
    console.log(`Fetching object ${id}...`);

    const obj = await client.getObject({
        id,
        options: {
            showContent: true,
            showDisplay: true,
            showType: true,
        }
    });

    console.log('Object Display:', JSON.stringify(obj.data?.display, null, 2));
    console.log('Object Content:', JSON.stringify(obj.data?.content, null, 2));
}

main().catch(console.error);
