export enum TaskStatus {
    PENDING = 0,
    ACTIVE = 1,
    COMPLETED = 2,
    CANCELLED = 3
}

export enum PatternType {
    PREFIX = 0,
    SUFFIX = 1,
    CONTAINS = 2
}

export interface Task {
    id: string; // UID or numeric ID depending on indexer
    task_id: string; // Object ID
    creator: string;
    reward_amount: string;
    pattern: string;
    pattern_type?: PatternType;
    target_type?: string;
    difficulty?: number;
    status: TaskStatus | string; // Allow string from API
    creation_time?: number;
    grace_period_ms?: number;
    lock_duration_ms?: number;
    timestamp_ms?: number;
    completer?: string;
    created_at?: string;

    // Blockchain Identifiers
    gas_object?: string;
    package_id?: string;
    nft_id?: string;

    // Attributes for filtering
    attributes?: {
        pattern_type?: string; // 'Numeric', 'Alphanumeric'
        length?: number;
        difficulty?: number;
    };
}

export interface Listing {
    listing_id: string;
    seller: string;
    price: string;
    type: string; // Struct tag e.g. 0x...::miner::GasObject
    status: string;
    timestamp_ms: number;
    
    // Enriched Data
    metadata?: {
        name?: string;
        description?: string;
        image_url?: string;
        attributes?: {
            trait_type: string;
            value: string | number;
        }[];
    };
}
