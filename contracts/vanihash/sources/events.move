/// Event definitions for the VaniHash protocol
module vanihash::events;

use std::ascii::String as AsciiString;
use std::string::String;
use sui::event;

/// Emitted when a new task is created
public struct TaskCreated has copy, drop {
    task_id: ID,
    creator: address,
    reward_amount: u64,
    prefix: String,
    suffix: String,
    contain: String,
    task_type: u8,
    target_type: AsciiString,
    difficulty: u8,
    lock_duration_ms: u64,
}

/// Emitted when a task is completed
public struct TaskCompleted has copy, drop {
    task_id: ID,
    miner: address,
    vanity_id: ID,
}

/// Emitted when a task is cancelled
public struct TaskCancelled has copy, drop {
    task_id: ID,
}

/// Emit task created event
public(package) fun emit_task_created(
    task_id: ID,
    creator: address,
    reward_amount: u64,
    prefix: String,
    suffix: String,
    contain: String,
    task_type: u8,
    target_type: AsciiString,
    difficulty: u8,
    lock_duration_ms: u64,
) {
    event::emit(TaskCreated {
        task_id,
        creator,
        reward_amount,
        prefix,
        suffix,
        contain,
        task_type,
        target_type,
        difficulty,
        lock_duration_ms,
    });
}

/// Emit task completed event
public(package) fun emit_task_completed(task_id: ID, miner: address, vanity_id: ID) {
    event::emit(TaskCompleted {
        task_id,
        miner,
        vanity_id,
    });
}

/// Emit task cancelled event
public(package) fun emit_task_cancelled(task_id: ID) {
    event::emit(TaskCancelled { task_id });
}
