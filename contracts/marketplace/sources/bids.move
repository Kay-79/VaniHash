module marketplace::bids;

use marketplace::config::{Self, MarketplaceConfig};
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
use sui::sui::SUI;
use sui::transfer_policy::{TransferPolicy, TransferRequest};

/// Error codes
const EPolicyMismatch: u64 = 1;

/// A Bid entry - Shared Object
public struct Bid has key, store {
    id: UID,
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
    seller: address,
    bidder: address,
    amount: u64,
}

public struct BidCancelled has copy, drop {
    bid_id: ID,
    bidder: address,
    amount: u64,
}

/// Create a Bid for any item in a specific Collection (Policy)
public fun create_bid<T>(payment: Coin<SUI>, policy: &TransferPolicy<T>, ctx: &mut TxContext) {
    let amount = coin::value(&payment);
    let bidder = ctx.sender();
    let policy_id = object::id(policy);

    let bid = Bid {
        id: object::new(ctx),
        bidder,
        amount: coin::into_balance(payment),
        policy_id,
    };

    let bid_id = object::id(&bid);

    transfer::share_object(bid);

    event::emit(BidCreated {
        bid_id,
        policy_id,
        amount,
        bidder,
    });
}

/// Cancel a bid and reclaim funds
/// Only the original bidder can cancel
public fun cancel_bid(bid: Bid, ctx: &mut TxContext) {
    let Bid { id, bidder, amount, policy_id: _ } = bid;
    let bid_id = object::uid_to_inner(&id);
    let amount_val = balance::value(&amount);

    object::delete(id);

    let refund = coin::from_balance(amount, ctx);
    transfer::public_transfer(refund, bidder);

    event::emit(BidCancelled {
        bid_id,
        bidder,
        amount: amount_val,
    });
}

/// Accept a Bid - returns TransferRequest for PTB to satisfy policy rules
///
/// Flow:
/// 1. Validates bid matches policy
/// 2. Lists item at bid price, then purchases (generates proper TransferRequest)
/// 3. Collects marketplace fee from proceeds
/// 4. Returns (Item, TransferRequest, bidder address)
///
/// Caller PTB must:
/// 1. Satisfy all TransferPolicy rules (royalty, floor price, etc.)
/// 2. Call transfer_policy::confirm_request
/// 3. Transfer the item to bidder (address returned)
/// 4. Seller withdraws proceeds from kiosk
public fun accept_bid<T: key + store>(
    bid: Bid,
    kiosk: &mut Kiosk,
    cap: &KioskOwnerCap,
    item_id: ID,
    policy: &TransferPolicy<T>,
    marketplace_config: &MarketplaceConfig,
    ctx: &mut TxContext,
): (T, TransferRequest<T>, address) {
    // 1. Destructure and validate bid
    let Bid { id, bidder, mut amount, policy_id } = bid;
    let bid_id = object::uid_to_inner(&id);
    object::delete(id);

    assert!(policy_id == object::id(policy), EPolicyMismatch);

    let bid_value = balance::value(&amount);

    // 2. Calculate and collect marketplace fee from bid amount
    let marketplace_fee = config::calculate_fee(marketplace_config, bid_value);
    if (marketplace_fee > 0) {
        let fee_balance = balance::split(&mut amount, marketplace_fee);
        let fee_coin = coin::from_balance(fee_balance, ctx);
        transfer::public_transfer(fee_coin, config::beneficiary(marketplace_config));
    };

    // 3. List item at remaining bid value (after fee deduction)
    let purchase_price = balance::value(&amount);
    kiosk::list<T>(kiosk, cap, item_id, purchase_price);

    // 4. Convert bid balance to coin for purchase
    let payment = coin::from_balance(amount, ctx);

    // 5. Purchase from kiosk - generates proper TransferRequest
    let (item, request) = kiosk::purchase<T>(kiosk, item_id, payment);

    // 6. Emit event
    event::emit(BidAccepted {
        bid_id,
        item_id,
        seller: ctx.sender(),
        bidder,
        amount: bid_value,
    });

    // 7. Return item + request for PTB, plus bidder address for transfer
    // Seller proceeds are now in kiosk, can withdraw via kiosk::withdraw
    (item, request, bidder)
}

/// Get bid bidder address
public fun bid_bidder(bid: &Bid): address {
    bid.bidder
}

/// Get bid amount
public fun bid_amount(bid: &Bid): u64 {
    balance::value(&bid.amount)
}

/// Get bid policy ID
public fun bid_policy_id(bid: &Bid): ID {
    bid.policy_id
}
