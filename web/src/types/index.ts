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
}
