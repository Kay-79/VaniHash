
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl, SuiEvent } from '@mysten/sui/jsonRpc';
import { CONFIG } from '../config';

export class SuiService {
    private client: SuiJsonRpcClient;

    constructor() {
        const url = CONFIG.RPC_URL || getJsonRpcFullnodeUrl(CONFIG.NETWORK);
        console.log(`Connecting to Sui Network: ${url}`);
        this.client = new SuiJsonRpcClient({ url });
    }

    async queryEvents(packageId: string, moduleName: string, cursor?: { txDigest: string, eventSeq: string }) {
        return this.client.queryEvents({
            query: { MoveModule: { package: packageId, module: moduleName } },
            cursor,
            limit: 50,
            order: 'ascending'
        });
    }
}
