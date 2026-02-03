/// VaniHash - Vanity address mining marketplace on Sui
/// Main contract module that orchestrates all components
module vanihash::vanihash;

use std::string::{Self, String};
use std::type_name;
use sui::balance;
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::package::{Self, UpgradeCap};
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
const INITIAL_VERSION: u64 = 1; // Only allow version 1 packages

/// Initialize the contract - creates and transfers AdminCap to deployer
fun init(ctx: &mut TxContext) {
    let admin_cap = admin::new(ctx);
    transfer::public_transfer(
        admin_cap,
        @0x32ff5fdf9cb8be86dd9be6d5904717a1348b3917bc270305745e08123981ec30,
    );

    // Create and share FeeVault
    transfer::share_object(FeeVault {
        id: object::new(ctx),
        balance: balance::zero(),
    });
}

/// Shared object to collect platform fees
public struct FeeVault has key {
    id: UID,
    balance: balance::Balance<SUI>,
}

const FEE_BPS: u64 = 500; // 5% fee

/// Create a new mining task
/// Create a new mining task
public entry fun create_task<T>(
    payment: Coin<SUI>,
    prefix_bytes: vector<u8>,
    suffix_bytes: vector<u8>,
    contains_bytes: vector<u8>,
    task_type: u8, // 0 = object, 1 = package
    lock_duration_ms: u64,
    bytecode: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // Validate inputs
    let value = coin::value(&payment);

    // Ensure at least one pattern is provided
    assert!(
        !vector::is_empty(&prefix_bytes) || 
        !vector::is_empty(&suffix_bytes) || 
        !vector::is_empty(&contains_bytes),
        errors::invalid_pattern(),
    );

    assert!(value > 0, errors::insufficient_reward());
    assert!(lock_duration_ms >= MIN_LOCK_PERIOD_MS, errors::lockup_too_short());
    assert!(
        task_type == task::task_type_object() || task_type == task::task_type_package(),
        errors::invalid_pattern_type(),
    );

    // Bytecode validation (basic check)
    if (task_type == task::task_type_package()) {
        assert!(!vector::is_empty(&bytecode), errors::invalid_proof()); // Reuse error or add invalid_bytecode
    };

    let creation_time = clock::timestamp_ms(clock);

    // Convert pattern bytes to Strings and validate
    let prefix_str = string::utf8(prefix_bytes);
    let suffix_str = string::utf8(suffix_bytes);
    let contains_str = string::utf8(contains_bytes);

    if (!string::is_empty(&prefix_str))
        assert!(pattern::validate_pattern(&prefix_str), errors::invalid_pattern());
    if (!string::is_empty(&suffix_str))
        assert!(pattern::validate_pattern(&suffix_str), errors::invalid_pattern());
    if (!string::is_empty(&contains_str))
        assert!(pattern::validate_pattern(&contains_str), errors::invalid_pattern());

    // Get target type and calculate difficulty
    let target_type = type_name::get<T>();
    let target_type_str = type_name::into_string(target_type);
    let difficulty = 0u8; // Could be calculated based on pattern complexity

    // Create task using task module
    let new_task = task::new(
        tx_context::sender(ctx),
        coin::into_balance(payment),
        prefix_str,
        suffix_str,
        contains_str,
        task_type,
        target_type_str,
        difficulty,
        creation_time,
        DEFAULT_GRACE_PERIOD_MS,
        lock_duration_ms,
        bytecode, // Pass bytecode
        ctx,
    );

    let task_id = object::uid_to_inner(task::id(&new_task));

    // Emit event
    events::emit_task_created(
        task_id,
        tx_context::sender(ctx),
        value,
        *task::prefix(&new_task),
        *task::suffix(&new_task),
        *task::contains(&new_task),
        task_type,
        *task::target_type(&new_task),
        difficulty,
        lock_duration_ms,
        *task::bytecode(&new_task),
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
    vault: &mut FeeVault,
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
    // Verify pattern match
    assert!(
        pattern::verify_pattern(
            &object_id,
            task::prefix(&task_obj),
            task::suffix(&task_obj),
            task::contains(&task_obj),
        ),
        errors::invalid_proof(),
    );

    // Extract task data and destroy task
    let (task_id_uid, mut reward, creator) = task::extract_reward(task_obj);
    let task_id = object::uid_to_inner(&task_id_uid);

    // Deduct Fee
    let reward_val = balance::value(&reward);
    let fee_val = (reward_val * FEE_BPS) / 10000;

    if (fee_val > 0) {
        let fee_bal = balance::split(&mut reward, fee_val);
        balance::join(&mut vault.balance, fee_bal);
    };

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
    vault: &mut FeeVault,
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

    // Verify package version is 1 (newly published)
    assert!(package::version(&upgrade_cap) == INITIAL_VERSION, errors::invalid_proof());

    // Extract Package ID from UpgradeCap
    let package_id = upgrade_cap.package();

    // Verify pattern match using pattern module
    // IMPORTANT: We validate the PACKAGE ID, not the UpgradeCap ID
    assert!(
        pattern::verify_pattern(
            &package_id,
            task::prefix(&task_obj),
            task::suffix(&task_obj),
            task::contains(&task_obj),
        ),
        errors::invalid_proof(),
    );

    // Extract task data and destroy task
    let (task_id_uid, mut reward, creator) = task::extract_reward(task_obj);
    let task_id = object::uid_to_inner(&task_id_uid);

    // Deduct Fee
    let reward_val = balance::value(&reward);
    let fee_val = (reward_val * FEE_BPS) / 10000;

    if (fee_val > 0) {
        let fee_bal = balance::split(&mut reward, fee_val);
        balance::join(&mut vault.balance, fee_bal);
    };

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

/// Admin: Withdraw accumulated fees
public entry fun withdraw_fees(_: &AdminCap, vault: &mut FeeVault, ctx: &mut TxContext) {
    let amount = balance::value(&vault.balance);
    let coin = coin::take(&mut vault.balance, amount, ctx);
    transfer::public_transfer(coin, tx_context::sender(ctx));
}

/// Helper View Function for Miners
/// Allows verifying if a pre-computed Package ID matches the task pattern
/// BEFORE spending gas to publish the package.
public fun verify_package_id_pattern(task_obj: &Task, package_id: address): bool {
    pattern::verify_pattern(
        &object::id_from_address(package_id),
        task::prefix(task_obj),
        task::suffix(task_obj),
        task::contains(task_obj),
    )
}
