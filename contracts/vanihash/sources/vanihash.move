/// VaniHash - Vanity address mining marketplace on Sui
/// Main contract module that orchestrates all components
module vanihash::vanihash;

use std::string::{Self, String};
use std::type_name;
use sui::balance;
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::package::UpgradeCap;
use sui::sui::SUI;
use vanihash::admin::{Self, AdminCap};
use vanihash::errors;
use vanihash::events;
use vanihash::pattern;
use vanihash::task::{Self, Task};

/// Constants
const MIN_LOCK_PERIOD_MS: u64 = 86400000; // 24 hours
const DEFAULT_GRACE_PERIOD_MS: u64 = 900000; // 15 minutes
const MAX_PATTERNS: u64 = 3; // Maximum 3 patterns per task

/// Initialize the contract - creates and transfers AdminCap to deployer
fun init(ctx: &mut TxContext) {
    let admin_cap = admin::new(ctx);
    transfer::public_transfer(admin_cap, ctx.sender());
}

/// Create a new mining task
public entry fun create_task<T>(
    payment: Coin<SUI>,
    patterns_bytes: vector<vector<u8>>,
    pattern_type: u8,
    task_type: u8, // 0 = object, 1 = package
    lock_duration_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Validate inputs
    let value = coin::value(&payment);
    let pattern_count = vector::length(&patterns_bytes);

    assert!(value > 0, errors::insufficient_reward());
    assert!(pattern_count > 0 && pattern_count <= MAX_PATTERNS, errors::invalid_pattern());
    assert!(lock_duration_ms >= MIN_LOCK_PERIOD_MS, errors::lockup_too_short());
    assert!(pattern::validate_pattern_type(pattern_type), errors::invalid_pattern_type());
    assert!(
        task_type == task::task_type_object() || task_type == task::task_type_package(),
        errors::invalid_pattern_type(),
    );

    let creation_time = clock::timestamp_ms(clock);

    // Convert pattern bytes to Strings and validate
    let mut patterns = vector::empty<String>();
    let mut i = 0;

    while (i < pattern_count) {
        let pattern_str = string::utf8(*vector::borrow(&patterns_bytes, i));
        assert!(pattern::validate_pattern(&pattern_str), errors::invalid_pattern());
        vector::push_back(&mut patterns, pattern_str);
        i = i + 1;
    };

    // Get target type and calculate difficulty
    let target_type = type_name::get<T>();
    let target_type_str = type_name::into_string(target_type);
    let difficulty = 0u8; // Could be calculated based on pattern complexity

    // Create task using task module
    let new_task = task::new(
        tx_context::sender(ctx),
        coin::into_balance(payment),
        patterns,
        pattern_type,
        task_type,
        target_type_str,
        difficulty,
        creation_time,
        DEFAULT_GRACE_PERIOD_MS,
        lock_duration_ms,
        ctx,
    );

    let task_id = object::uid_to_inner(task::id(&new_task));

    // Extract individual patterns (empty string if not provided)
    let prefix_pattern = if (vector::length(&patterns) > 0) { *vector::borrow(&patterns, 0) } else {
        string::utf8(b"")
    };
    let suffix_pattern = if (vector::length(&patterns) > 1) { *vector::borrow(&patterns, 1) } else {
        string::utf8(b"")
    };
    let contain_pattern = if (vector::length(&patterns) > 2) { *vector::borrow(&patterns, 2) }
    else { string::utf8(b"") };

    // Emit event
    events::emit_task_created(
        task_id,
        tx_context::sender(ctx),
        value,
        prefix_pattern,
        suffix_pattern,
        contain_pattern,
        task_type,
        *task::target_type(&new_task),
        difficulty,
    );

    // Share the task object
    transfer::public_share_object(new_task);
}

/// Cancel a task (creator only, respects grace period and lock period)
public entry fun cancel_task(task: &mut Task, clock: &Clock, ctx: &mut TxContext) {
    // Verify creator
    assert!(task::creator(task) == tx_context::sender(ctx), errors::not_creator());

    // Verify task is not already completed or cancelled
    let status = task::status(task);
    assert!(
        status != task::status_completed() && status != task::status_cancelled(),
        errors::task_not_active(),
    );

    let current_time = clock::timestamp_ms(clock);
    let creation_time = task::creation_time(task);
    let grace_period_ms = task::grace_period_ms(task);
    let lock_duration_ms = task::lock_duration_ms(task);

    // Check grace period and lock period
    let is_in_grace_period = current_time < creation_time + grace_period_ms;
    let is_lock_expired = current_time >= creation_time + lock_duration_ms;

    assert!(
        is_in_grace_period || is_lock_expired,
        if (is_in_grace_period) { errors::grace_period_active() } else {
            errors::lock_period_active()
        },
    );

    // Mark task as cancelled
    task::cancel(task);

    // Emit event
    events::emit_task_cancelled(object::uid_to_inner(task::id(task)));
}

/// Submit proof for a task
public fun submit_proof<T: key + store>(
    task_obj: Task,
    vanity_object: T,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let object_id = object::id(&vanity_object);
    let current_time = clock::timestamp_ms(clock);

    // Verify task status
    let status = task::status(&task_obj);
    assert!(
        status != task::status_completed() && status != task::status_cancelled(),
        errors::task_not_active(),
    );

    // Verify grace period has passed
    let creation_time = task::creation_time(&task_obj);
    let grace_period_ms = task::grace_period_ms(&task_obj);

    assert!(current_time >= creation_time + grace_period_ms, errors::grace_period_active());

    // Verify object type matches
    let actual_type = type_name::get<T>();
    let actual_type_str = type_name::into_string(actual_type);
    let expected_type_str = task::target_type(&task_obj);

    assert!(
        std::ascii::as_bytes(&actual_type_str) == std::ascii::as_bytes(expected_type_str),
        errors::invalid_object_type(),
    );

    // Verify pattern match using pattern module
    assert!(
        pattern::verify_pattern(
            &object_id,
            task::patterns(&task_obj),
            task::pattern_type(&task_obj),
        ),
        errors::invalid_proof(),
    );

    // Extract task data and destroy task
    let (task_id_uid, reward, creator) = task::extract_reward(task_obj);
    let task_id = object::uid_to_inner(&task_id_uid);

    // Transfer reward to miner
    let reward_coin = coin::from_balance(reward, ctx);
    transfer::public_transfer(reward_coin, tx_context::sender(ctx));

    // Transfer vanity object to creator
    transfer::public_transfer(vanity_object, creator);

    // Delete task
    object::delete(task_id_uid);

    // Emit event
    events::emit_task_completed(
        task_id,
        tx_context::sender(ctx),
        object_id,
    );
}

/// Submit package proof for a package mining task
/// Miner publishes packages until finding one with desired Package ID pattern
/// Then submits the UpgradeCap as proof
public fun submit_package_proof(
    task_obj: Task,
    upgrade_cap: UpgradeCap,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let current_time = clock::timestamp_ms(clock);

    // Verify task is PACKAGE type
    assert!(task::task_type(&task_obj) == task::task_type_package(), errors::invalid_object_type());

    // Verify task status
    let status = task::status(&task_obj);
    assert!(
        status != task::status_completed() && status != task::status_cancelled(),
        errors::task_not_active(),
    );

    // Verify grace period has passed
    let creation_time = task::creation_time(&task_obj);
    let grace_period_ms = task::grace_period_ms(&task_obj);

    assert!(current_time >= creation_time + grace_period_ms, errors::grace_period_active());

    // Extract Package ID from UpgradeCap
    let package_id = upgrade_cap.package();

    // Verify pattern match using pattern module
    // IMPORTANT: We validate the PACKAGE ID, not the UpgradeCap ID
    assert!(
        pattern::verify_pattern(
            &package_id,
            task::patterns(&task_obj),
            task::pattern_type(&task_obj),
        ),
        errors::invalid_proof(),
    );

    // Extract task data and destroy task
    let (task_id_uid, reward, creator) = task::extract_reward(task_obj);
    let task_id = object::uid_to_inner(&task_id_uid);

    // Transfer reward to miner
    let reward_coin = coin::from_balance(reward, ctx);
    transfer::public_transfer(reward_coin, tx_context::sender(ctx));

    // Transfer UpgradeCap to creator
    transfer::public_transfer(upgrade_cap, creator);

    // Delete task
    object::delete(task_id_uid);

    // Emit event
    events::emit_task_completed(
        task_id,
        tx_context::sender(ctx),
        package_id,
    );
}
