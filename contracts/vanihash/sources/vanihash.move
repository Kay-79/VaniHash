module vanihash::vanihash;

use std::string::{Self, String};
use std::type_name;
use std::vector;
use sui::balance::{Self, Balance};
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;

/// Error codes
const ETaskNotPending: u64 = 1;
const ETaskNotActive: u64 = 2;
// const EGracePeriodNotOver: u64 = 3; // Unused
// const EGracePeriodOver: u64 = 4; // Unused
const ELockUpNotOver: u64 = 5;
const EInvalidPattern: u64 = 6;
const ENotCreator: u64 = 7;
const EInsufficientReward: u64 = 8;
const ELockUpTooShort: u64 = 9;
const ETypeMismatch: u64 = 10;

/// Task Status
const STATUS_PENDING: u8 = 0; // Grace period
const STATUS_ACTIVE: u8 = 1; // Mining phase
const STATUS_COMPLETED: u8 = 2; // Success
const STATUS_CANCELLED: u8 = 3; // Cancelled

/// Constants
const MIN_LOCK_PERIOD_MS: u64 = 86400000; // 24 hours
const DEFAULT_GRACE_PERIOD_MS: u64 = 0; // 0 minutes for testing

/// The core Task object
public struct Task has key, store {
    id: UID,
    creator: address,
    reward: Balance<SUI>,
    pattern: String,
    /// 0: Prefix, 1: Suffix, 2: Contains
    pattern_type: u8,
    target_type: String,
    difficulty: u8,
    status: u8,
    creation_time: u64,
    grace_period_ms: u64,
    lock_duration_ms: u64,
}

/// Events
public struct TaskCreated has copy, drop {
    task_id: ID,
    creator: address,
    reward_amount: u64,
    pattern: String,
    target_type: String,
    difficulty: u8,
}

public struct TaskCompleted has copy, drop {
    task_id: ID,
    miner: address,
    vanity_id: ID,
}

public struct TaskCancelled has copy, drop {
    task_id: ID,
}

// --- Core Functions ---

public entry fun create_task<T>(
    payment: Coin<SUI>,
    pattern_bytes: vector<u8>,
    pattern_type: u8,
    lock_duration_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let value = coin::value(&payment);
    assert!(value > 0, EInsufficientReward);
    assert!(lock_duration_ms >= MIN_LOCK_PERIOD_MS, ELockUpTooShort);

    let creation_time = clock::timestamp_ms(clock);
    let pattern = string::utf8(pattern_bytes);
    let difficulty = (vector::length(&pattern_bytes) as u8);

    // Capture the target type name
    let type_name_ascii = type_name::into_string(type_name::get<T>());
    let target_type = string::from_ascii(type_name_ascii);

    let id = object::new(ctx);
    let task_id = object::uid_to_inner(&id);

    event::emit(TaskCreated {
        task_id,
        creator: tx_context::sender(ctx),
        reward_amount: value,
        pattern: pattern,
        target_type: target_type,
        difficulty,
    });

    let task = Task {
        id,
        creator: tx_context::sender(ctx),
        reward: coin::into_balance(payment),
        pattern,
        pattern_type,
        target_type,
        difficulty,
        status: STATUS_PENDING,
        creation_time,
        grace_period_ms: DEFAULT_GRACE_PERIOD_MS,
        lock_duration_ms,
    };

    transfer::share_object(task);
}

public entry fun cancel_task(task: &mut Task, clock: &Clock, ctx: &mut TxContext) {
    assert!(task.creator == tx_context::sender(ctx), ENotCreator);
    assert!(task.status != STATUS_COMPLETED && task.status != STATUS_CANCELLED, ETaskNotActive);

    let current_time = clock::timestamp_ms(clock);
    let is_in_grace_period = current_time < task.creation_time + task.grace_period_ms;
    let is_lock_expired = current_time > task.creation_time + task.lock_duration_ms;

    // Can cancel if in grace period OR lock-up expired.
    // If not in grace period AND lock-up not expired, fail.
    if (!is_in_grace_period && !is_lock_expired) {
        abort ELockUpNotOver
    };

    task.status = STATUS_CANCELLED;

    let reward_amount = balance::value(&task.reward);
    let refund = coin::take(&mut task.reward, reward_amount, ctx);
    transfer::public_transfer(refund, task.creator);

    event::emit(TaskCancelled {
        task_id: object::uid_to_inner(&task.id),
    });
}

public fun submit_proof<T: key + store>(
    task: Task,
    vanity_object: T,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let Task {
        id,
        creator,
        reward,
        pattern,
        pattern_type,
        target_type,
        difficulty: _,
        status,
        creation_time,
        grace_period_ms,
        lock_duration_ms: _,
    } = task;

    // Verify Grace Period manually since we destructed the object
    if (status == STATUS_PENDING) {
        let current_time = clock::timestamp_ms(clock);
        if (current_time < creation_time + grace_period_ms) {
            abort ETaskNotActive
        };
    };

    // Verify Active Status
    assert!(status != STATUS_COMPLETED && status != STATUS_CANCELLED, ETaskNotActive);

    // Verify Type Match
    let proof_type_ascii = type_name::into_string(type_name::get<T>());
    let proof_type = string::from_ascii(proof_type_ascii);
    assert!(proof_type == target_type, ETypeMismatch);

    let object_id = object::id(&vanity_object);
    assert!(verify_pattern(&object_id, &pattern, pattern_type), EInvalidPattern);

    // 1. Transfer Reward to Miner
    // reward_val is not needed if we convert whole balance to coin
    let coin = coin::from_balance(reward, ctx);
    transfer::public_transfer(coin, tx_context::sender(ctx));

    // 2. Transfer Object to Creator
    transfer::public_transfer(vanity_object, creator);

    // 3. Delete Task Object
    let task_id = object::uid_to_inner(&id); // Get ID before deletion
    object::delete(id);

    // 4. Emit Event
    event::emit(TaskCompleted {
        task_id,
        miner: tx_context::sender(ctx),
        vanity_id: object_id,
    });
}

/// Verifies if the object ID matches the pattern
fun verify_pattern(id: &ID, pattern: &String, pattern_type: u8): bool {
    let id_bytes = object::id_to_bytes(id);
    let hex_string = id_to_hex_string(&id_bytes);

    let pattern_bytes = string::bytes(pattern);
    let id_str_bytes = string::bytes(&hex_string);

    if (pattern_type == 0) {
        // Prefix
        return starts_with(id_str_bytes, pattern_bytes)
    } else if (pattern_type == 1) {
        // Suffix
        return ends_with(id_str_bytes, pattern_bytes)
    } else if (pattern_type == 2) {
        // Contains
        return contains(id_str_bytes, pattern_bytes)
    };
    false
}

/// Converts 32-byte ID to 64-char lowercase hex string
fun id_to_hex_string(bytes: &vector<u8>): String {
    let mut hex_chars = vector::empty<u8>();
    let len = vector::length(bytes);
    let mut i = 0;
    while (i < len) {
        let b = *vector::borrow(bytes, i);
        let high = b >> 4;
        let low = b & 0xF;
        vector::push_back(&mut hex_chars, to_hex_char(high));
        vector::push_back(&mut hex_chars, to_hex_char(low));
        i = i + 1;
    };
    string::utf8(hex_chars)
}

fun to_hex_char(val: u8): u8 {
    if (val < 10) { val + 48 } else { val + 87 } // 0-9 ('0'=48), a-f ('a'=97 -> 10+87=97)
}

fun starts_with(haystack: &vector<u8>, needle: &vector<u8>): bool {
    let h_len = vector::length(haystack);
    let n_len = vector::length(needle);
    if (n_len > h_len) return false;

    let mut i = 0;
    while (i < n_len) {
        if (vector::borrow(haystack, i) != vector::borrow(needle, i)) return false;
        i = i + 1;
    };
    true
}

fun ends_with(haystack: &vector<u8>, needle: &vector<u8>): bool {
    let h_len = vector::length(haystack);
    let n_len = vector::length(needle);
    if (n_len > h_len) return false;

    let start = h_len - n_len;
    let mut i = 0;
    while (i < n_len) {
        if (vector::borrow(haystack, start + i) != vector::borrow(needle, i)) return false;
        i = i + 1;
    };
    true
}

fun contains(haystack: &vector<u8>, needle: &vector<u8>): bool {
    let h_len = vector::length(haystack);
    let n_len = vector::length(needle);
    if (n_len > h_len) return false;
    if (n_len == 0) return true;

    let mut i = 0;
    while (i <= h_len - n_len) {
        let mut j = 0;
        let mut match_found = true;
        while (j < n_len) {
            if (vector::borrow(haystack, i + j) != vector::borrow(needle, j)) {
                match_found = false;
                break
            };
            j = j + 1;
        };
        if (match_found) return true;
        i = i + 1;
    };
    false
}
