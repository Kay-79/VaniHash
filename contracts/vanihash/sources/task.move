/// Task struct and core task operations
module vanihash::task;

use std::ascii::String as AsciiString;
use std::string::{Self, String};
use sui::balance::{Self, Balance};
use sui::sui::SUI;

/// Task type constants
const TASK_TYPE_OBJECT: u8 = 0; // Regular object mining
const TASK_TYPE_PACKAGE: u8 = 1; // Package ID mining

/// Task status constants
const STATUS_PENDING: u8 = 0;
const STATUS_ACTIVE: u8 = 1;
const STATUS_COMPLETED: u8 = 2;
const STATUS_CANCELLED: u8 = 3;

// Public getters for task type constants
public fun task_type_object(): u8 { TASK_TYPE_OBJECT }

public fun task_type_package(): u8 { TASK_TYPE_PACKAGE }

// Public getters for status constants
public fun status_pending(): u8 { STATUS_PENDING }

public fun status_active(): u8 { STATUS_ACTIVE }

public fun status_completed(): u8 { STATUS_COMPLETED }

public fun status_cancelled(): u8 { STATUS_CANCELLED }

/// The core Task object
public struct Task has key, store {
    id: UID,
    creator: address,
    reward: Balance<SUI>,
    prefix: String,
    suffix: String,
    contains: String,
    task_type: u8, // 0 = object, 1 = package
    target_type: AsciiString,
    difficulty: u8,
    status: u8,
    creation_time: u64,
    grace_period_ms: u64,
    lock_duration_ms: u64,
    bytecode: vector<u8>,
}

/// Create a new task
public(package) fun new(
    creator: address,
    reward: Balance<SUI>,
    prefix: String,
    suffix: String,
    contains: String,
    task_type: u8,
    target_type: AsciiString,
    difficulty: u8,
    creation_time: u64,
    grace_period_ms: u64,
    lock_duration_ms: u64,
    bytecode: vector<u8>,
    ctx: &mut TxContext,
): Task {
    Task {
        id: object::new(ctx),
        creator,
        reward,
        prefix,
        suffix,
        contains,
        task_type,
        target_type,
        difficulty,
        status: STATUS_PENDING,
        creation_time,
        grace_period_ms,
        lock_duration_ms,
        bytecode,
    }
}

/// Mark task as completed
public(package) fun complete(task: &mut Task) {
    task.status = STATUS_COMPLETED;
}

/// Mark task as cancelled
public(package) fun cancel(task: &mut Task) {
    task.status = STATUS_CANCELLED;
}

/// Extract reward from task (consumes task)
public(package) fun extract_reward(task: Task): (UID, Balance<SUI>, address) {
    let Task {
        id,
        creator,
        reward,
        prefix: _,
        suffix: _,
        contains: _,
        task_type: _,
        target_type: _,
        difficulty: _,
        status: _,
        creation_time: _,
        grace_period_ms: _,
        lock_duration_ms: _,
        bytecode: _,
    } = task;

    (id, reward, creator)
}

// ===// Getter functions
public fun id(task: &Task): &UID { &task.id }

public fun creator(task: &Task): address { task.creator }

public fun reward(task: &Task): u64 { balance::value(&task.reward) }

public fun reward_mut(task: &mut Task): &mut Balance<SUI> { &mut task.reward }

public fun prefix(task: &Task): &String { &task.prefix }

public fun suffix(task: &Task): &String { &task.suffix }

public fun contains(task: &Task): &String { &task.contains }

public fun task_type(task: &Task): u8 { task.task_type }

public fun target_type(task: &Task): &AsciiString { &task.target_type }

public fun difficulty(task: &Task): u8 { task.difficulty }

public fun status(task: &Task): u8 { task.status }

public fun creation_time(task: &Task): u64 { task.creation_time }

public fun grace_period_ms(task: &Task): u64 { task.grace_period_ms }

public fun lock_duration_ms(task: &Task): u64 { task.lock_duration_ms }

public fun pattern_count(task: &Task): u64 {
    let mut count = 0;
    if (!string::is_empty(&task.prefix)) { count = count + 1 };
    if (!string::is_empty(&task.suffix)) { count = count + 1 };
    if (!string::is_empty(&task.contains)) { count = count + 1 };
    if (!string::is_empty(&task.suffix)) { count = count + 1 };
    if (!string::is_empty(&task.contains)) { count = count + 1 };
    count
}

public fun bytecode(task: &Task): &vector<u8> { &task.bytecode }
