module marketplace::royalty_rule;

use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::transfer_policy::{Self, TransferPolicy, TransferPolicyCap, TransferRequest};

/// The Rule witness.
public struct Rule has drop {}

/// Configuration for the Rule.
public struct Config has drop, store {
    amount_bp: u16,
    beneficiary: address,
}

const EInsufficientAmount: u64 = 0;
const EInvalidBp: u64 = 1;

/// Adds the Royalty Rule to the Transfer Policy.
public fun add<T>(
    policy: &mut TransferPolicy<T>,
    cap: &TransferPolicyCap<T>,
    amount_bp: u16,
    beneficiary: address,
) {
    assert!(amount_bp <= 10000, EInvalidBp);
    transfer_policy::add_rule(Rule {}, policy, cap, Config { amount_bp, beneficiary });
}

/// Pays the royalty required by the Rule.
/// The `payment` coin must be at least the calculated royalty amount.
/// The payment is transferred to the beneficiary.
public fun pay<T>(
    policy: &mut TransferPolicy<T>,
    request: &mut TransferRequest<T>,
    payment: Coin<SUI>,
) {
    let config: &Config = transfer_policy::get_rule(Rule {}, policy);

    let paid = transfer_policy::paid(request);
    let royalty_amount = (((paid as u128) * (config.amount_bp as u128) / 10000) as u64);

    assert!(coin::value(&payment) >= royalty_amount, EInsufficientAmount);

    transfer::public_transfer(payment, config.beneficiary);
    transfer_policy::add_receipt(Rule {}, request);
}

/// Helper to calculate royalty amount for a given price and policy.
/// Useful for other modules to know how much to split.
public fun fee_amount<T>(policy: &TransferPolicy<T>, price: u64): u64 {
    // If the rule exists, calculate. Check if rule exists first?
    // Move doesn't have "has_rule" easily exposed without witness.
    // Assuming we know the rule is there OR we just expose calculation for those who know.
    // However, `get_rule` aborts if rule is missing.
    // For our specific marketplace `bids` module, we assume this rule is used.
    if (!transfer_policy::has_rule<T, Rule>(policy)) {
        return 0
    };
    let config: &Config = transfer_policy::get_rule(Rule {}, policy);
    (((price as u128) * (config.amount_bp as u128) / 10000) as u64)
}
