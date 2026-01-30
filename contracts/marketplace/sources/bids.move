module marketplace::bids;

use marketplace::royalty_rule;
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::transfer_policy::{Self, TransferPolicy};

/// Error codes
const EPolicyMismatch: u64 = 1;

/// Shared Object to store all active bids
public struct BidPool has key {
    id: UID,
    bids: Table<ID, Bid>,
}

/// A Bid entry
public struct Bid has store {
    bidder: address,
    amount: Balance<SUI>,
    policy_id: ID,
}

/// Events
public struct BidCreated has copy, drop {
    bid_id: ID,
    policy_id: ID,
    amount: u64,
    bidder: address,
}

public struct BidAccepted has copy, drop {
    bid_id: ID,
    item_id: ID,
    u_addr: address, // seller
    amount: u64,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(BidPool {
        id: object::new(ctx),
        bids: table::new(ctx),
    });
}

/// Create a Bid for any item in a specific Collection (Policy)
public fun create_bid<T>(
    pool: &mut BidPool,
    payment: Coin<SUI>,
    policy: &TransferPolicy<T>,
    ctx: &mut TxContext,
) {
    let amount = coin::value(&payment);
    let bidder = ctx.sender();
    let policy_id = object::id(policy); // We rely on Policy ID to identify collection

    let uid = object::new(ctx);
    let bid_id = object::uid_to_inner(&uid);
    object::delete(uid); // Delete UID, just used for ID generation

    let bid = Bid {
        bidder,
        amount: coin::into_balance(payment),
        policy_id,
    };

    table::add(&mut pool.bids, bid_id, bid);

    event::emit(BidCreated {
        bid_id,
        policy_id,
        amount,
        bidder,
    });
}

/// Accept a Bid.
/// Callable by Kiosk Owner (Seller/Miner).
/// Atomic: Take Item -> Calculate Net -> Pay Royalty -> Pay Seller -> Transfer Item to Bidder.
public fun accept_bid<T: key + store>(
    pool: &mut BidPool,
    kiosk: &mut Kiosk,
    cap: &KioskOwnerCap,
    item_id: ID,
    bid_id: ID,
    policy: &mut TransferPolicy<T>,
    ctx: &mut TxContext,
) {
    // 1. Remove Bid
    let Bid { bidder, mut amount, policy_id } = table::remove(&mut pool.bids, bid_id);
    assert!(policy_id == object::id(policy), EPolicyMismatch);

    // 2. Take Item from Kiosk
    // This returns the Item.
    // Note: Kiosk Take does NO payment checks. Listing price is ignored.
    // The "deal" is implied by the Bid.
    // We manually generate a TransferRequest to satisfy policy.
    let item = kiosk::take<T>(kiosk, cap, item_id);
    let total_bid_val = balance::value(&amount);

    let mut request = transfer_policy::new_request(item_id, total_bid_val, object::id(kiosk));
    let royalty_val = royalty_rule::fee_amount(policy, total_bid_val);

    // Take royalty from balance
    let royalty_bal = balance::split(&mut amount, royalty_val);
    let royalty_coin = coin::from_balance(royalty_bal, ctx);

    // 4. Pay Royalty & Confirm
    // `royalty_rule::pay` requires Coin.
    royalty_rule::pay(policy, &mut request, royalty_coin);
    transfer_policy::confirm_request(policy, request);

    // 5. Pay Seller (Miner)
    // The remaining `amount` is the Net profit.
    let seller_pay = coin::from_balance(amount, ctx);
    transfer::public_transfer(seller_pay, ctx.sender());

    // 6. Transfer Item to Bidder
    transfer::public_transfer(item, bidder);

    event::emit(BidAccepted {
        bid_id,
        item_id,
        u_addr: ctx.sender(),
        amount: total_bid_val,
    });
}
