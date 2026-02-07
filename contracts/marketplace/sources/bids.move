/// VaniHash Marketplace - Bidding System
///
/// Allows buyers to make offers on any listed item or even items not yet listed.
/// Works with the escrow-based marketplace without requiring Kiosk or TransferPolicy.
///
/// Flow for existing listings:
/// 1. Buyer calls `create_bid()` with funds + listing_id
/// 2. Seller calls `accept_bid()` to accept and transfer item
/// 3. Or buyer calls `cancel_bid()` to reclaim funds
///
/// Flow for offers on any item:
/// 1. Buyer calls `create_offer()` with funds + target item_id
/// 2. Owner calls `accept_offer()` transferring item directly
/// 3. Or buyer calls `cancel_offer()` to reclaim funds
module marketplace::bids;

use marketplace::config::{Self, MarketplaceConfig};
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;

/// Error codes
const ENotBidder: u64 = 1;
const ENotSeller: u64 = 2;
const EBidNotActive: u64 = 3;

/// A Bid on a specific listing
public struct Bid has key {
    id: UID,
    /// The listing this bid is for
    listing_id: ID,
    /// Bidder's address
    bidder: address,
    /// Locked funds
    amount: Balance<SUI>,
    /// Active status
    active: bool,
}

/// An Offer for any item (not necessarily listed)
public struct Offer has key {
    id: UID,
    /// The item being offered on
    item_id: ID,
    /// Offerer's address
    offerer: address,
    /// Locked funds
    amount: Balance<SUI>,
    /// Active status
    active: bool,
}

// ============ Events ============

public struct BidCreated has copy, drop {
    bid_id: ID,
    listing_id: ID,
    amount: u64,
    bidder: address,
}

public struct BidAccepted has copy, drop {
    bid_id: ID,
    listing_id: ID,
    amount: u64,
    seller: address,
    bidder: address,
}

public struct BidCancelled has copy, drop {
    bid_id: ID,
    listing_id: ID,
    amount: u64,
    bidder: address,
}

public struct OfferCreated has copy, drop {
    offer_id: ID,
    item_id: ID,
    amount: u64,
    offerer: address,
}

public struct OfferAccepted has copy, drop {
    offer_id: ID,
    item_id: ID,
    amount: u64,
    seller: address,
    offerer: address,
}

public struct OfferCancelled has copy, drop {
    offer_id: ID,
    item_id: ID,
    amount: u64,
    offerer: address,
}

// ============ Bid Functions (for listed items) ============

/// Create a bid on a listing
public fun create_bid(payment: Coin<SUI>, listing_id: ID, ctx: &mut TxContext) {
    let amount_val = coin::value(&payment);
    let bidder = ctx.sender();

    let bid = Bid {
        id: object::new(ctx),
        listing_id,
        bidder,
        amount: coin::into_balance(payment),
        active: true,
    };
    let bid_id = object::id(&bid);

    event::emit(BidCreated {
        bid_id,
        listing_id,
        amount: amount_val,
        bidder,
    });

    transfer::share_object(bid);
}

/// Cancel a bid and reclaim funds
/// Only the original bidder can cancel
public fun cancel_bid(bid: &mut Bid, ctx: &mut TxContext) {
    assert!(ctx.sender() == bid.bidder, ENotBidder);
    assert!(bid.active, EBidNotActive);

    bid.active = false;
    let amount_val = balance::value(&bid.amount);
    let refund = coin::from_balance(balance::withdraw_all(&mut bid.amount), ctx);

    event::emit(BidCancelled {
        bid_id: object::id(bid),
        listing_id: bid.listing_id,
        amount: amount_val,
        bidder: bid.bidder,
    });

    transfer::public_transfer(refund, bid.bidder);
}

/// Accept a bid on your listing
/// The listing item should be passed separately and transferred to bidder
#[allow(lint(self_transfer))]
public fun accept_bid<T: key + store>(
    bid: &mut Bid,
    item: T,
    config: &MarketplaceConfig,
    ctx: &mut TxContext,
): (T, address) {
    assert!(bid.active, EBidNotActive);

    bid.active = false;
    let seller = ctx.sender();
    let bidder = bid.bidder;
    let amount_val = balance::value(&bid.amount);

    // Calculate and collect fee
    let marketplace_fee = config::calculate_fee(config, amount_val);

    // Collect fee
    if (marketplace_fee > 0) {
        let fee_balance = balance::split(&mut bid.amount, marketplace_fee);
        let fee_coin = coin::from_balance(fee_balance, ctx);
        transfer::public_transfer(fee_coin, config::beneficiary(config));
    };

    // Send remainder to seller
    let seller_payment = coin::from_balance(balance::withdraw_all(&mut bid.amount), ctx);
    transfer::public_transfer(seller_payment, seller);

    event::emit(BidAccepted {
        bid_id: object::id(bid),
        listing_id: bid.listing_id,
        amount: amount_val,
        seller,
        bidder,
    });

    // Return item and bidder address for PTB to transfer
    (item, bidder)
}

// ============ Offer Functions (for any item) ============

/// Create an offer for any item (doesn't need to be listed)
public fun create_offer(payment: Coin<SUI>, item_id: ID, ctx: &mut TxContext) {
    let amount_val = coin::value(&payment);
    let offerer = ctx.sender();

    let offer = Offer {
        id: object::new(ctx),
        item_id,
        offerer,
        amount: coin::into_balance(payment),
        active: true,
    };
    let offer_id = object::id(&offer);

    event::emit(OfferCreated {
        offer_id,
        item_id,
        amount: amount_val,
        offerer,
    });

    transfer::share_object(offer);
}

/// Cancel an offer and reclaim funds
public fun cancel_offer(offer: &mut Offer, ctx: &mut TxContext) {
    assert!(ctx.sender() == offer.offerer, ENotBidder);
    assert!(offer.active, EBidNotActive);

    offer.active = false;
    let amount_val = balance::value(&offer.amount);
    let refund = coin::from_balance(balance::withdraw_all(&mut offer.amount), ctx);

    event::emit(OfferCancelled {
        offer_id: object::id(offer),
        item_id: offer.item_id,
        amount: amount_val,
        offerer: offer.offerer,
    });

    transfer::public_transfer(refund, offer.offerer);
}

/// Accept an offer for your item
/// Transfers item to offerer, payment to seller (minus fee)
#[allow(lint(self_transfer))]
public fun accept_offer<T: key + store>(
    offer: &mut Offer,
    item: T,
    config: &MarketplaceConfig,
    ctx: &mut TxContext,
): (T, address) {
    assert!(offer.active, EBidNotActive);
    assert!(object::id(&item) == offer.item_id, ENotSeller);

    offer.active = false;
    let seller = ctx.sender();
    let offerer = offer.offerer;
    let amount_val = balance::value(&offer.amount);

    // Calculate and collect fee
    let marketplace_fee = config::calculate_fee(config, amount_val);

    if (marketplace_fee > 0) {
        let fee_balance = balance::split(&mut offer.amount, marketplace_fee);
        let fee_coin = coin::from_balance(fee_balance, ctx);
        transfer::public_transfer(fee_coin, config::beneficiary(config));
    };

    // Send remainder to seller
    let seller_payment = coin::from_balance(balance::withdraw_all(&mut offer.amount), ctx);
    transfer::public_transfer(seller_payment, seller);

    event::emit(OfferAccepted {
        offer_id: object::id(offer),
        item_id: offer.item_id,
        amount: amount_val,
        seller,
        offerer,
    });

    // Return item and offerer address for PTB to transfer
    (item, offerer)
}

// ============ View Functions ============

public fun bid_bidder(bid: &Bid): address { bid.bidder }

public fun bid_amount(bid: &Bid): u64 { balance::value(&bid.amount) }

public fun bid_listing_id(bid: &Bid): ID { bid.listing_id }

public fun bid_is_active(bid: &Bid): bool { bid.active }

public fun offer_offerer(offer: &Offer): address { offer.offerer }

public fun offer_amount(offer: &Offer): u64 { balance::value(&offer.amount) }

public fun offer_item_id(offer: &Offer): ID { offer.item_id }

public fun offer_is_active(offer: &Offer): bool { offer.active }
