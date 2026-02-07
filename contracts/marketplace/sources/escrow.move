/// VaniHash Marketplace - Simple Escrow-based Trading
///
/// A streamlined marketplace for trading any Sui object (UpgradeCap, Coins, NFTs, etc.)
/// without requiring Kiosk setup or TransferPolicy configuration.
///
/// Flow:
/// 1. Seller calls `list()` - item stored in shared Listing object
/// 2. Buyer calls `buy()` - pays price + 2% fee, receives item instantly
/// 3. Or seller calls `cancel()` - reclaims item
module marketplace::escrow;

use marketplace::config::{Self, MarketplaceConfig};
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;

/// Error codes
const ENotSeller: u64 = 1;
const EInsufficientPayment: u64 = 2;
const EListingNotActive: u64 = 3;

/// A listing that holds an item for sale
public struct Listing<T: key + store> has key {
    id: UID,
    /// The item being sold (None after purchase/cancel)
    item: Option<T>,
    /// Price in MIST
    price: u64,
    /// Seller's address (receives payment)
    seller: address,
}

// ============ Events ============

public struct ItemListed has copy, drop {
    listing_id: ID,
    item_id: ID,
    item_type: vector<u8>,
    price: u64,
    seller: address,
}

public struct ItemPurchased has copy, drop {
    listing_id: ID,
    item_id: ID,
    price: u64,
    seller: address,
    buyer: address,
    marketplace_fee: u64,
}

public struct ItemDelisted has copy, drop {
    listing_id: ID,
    item_id: ID,
    seller: address,
}

public struct PriceUpdated has copy, drop {
    listing_id: ID,
    old_price: u64,
    new_price: u64,
}

// ============ Core Functions ============

/// List an item for sale
/// Item is transferred into a shared Listing object
public fun list<T: key + store>(item: T, price: u64, ctx: &mut TxContext): ID {
    let item_id = object::id(&item);
    let seller = ctx.sender();

    let listing = Listing {
        id: object::new(ctx),
        item: option::some(item),
        price,
        seller,
    };
    let listing_id = object::id(&listing);

    event::emit(ItemListed {
        listing_id,
        item_id,
        item_type: b"", // Type info not available in Move, frontend can infer
        price,
        seller,
    });

    transfer::share_object(listing);
    listing_id
}

/// Purchase a listed item
/// Collects 2% marketplace fee, sends price to seller, returns item to buyer
#[allow(lint(self_transfer))]
public fun buy<T: key + store>(
    listing: &mut Listing<T>,
    mut payment: Coin<SUI>,
    config: &MarketplaceConfig,
    ctx: &mut TxContext,
): T {
    assert!(option::is_some(&listing.item), EListingNotActive);

    let price = listing.price;
    let marketplace_fee = config::calculate_fee(config, price);
    let total_required = price + marketplace_fee;

    assert!(coin::value(&payment) >= total_required, EInsufficientPayment);

    // Collect marketplace fee
    config::collect_fee(config, &mut payment, price, ctx);

    // Send price to seller
    let seller_payment = coin::split(&mut payment, price, ctx);
    transfer::public_transfer(seller_payment, listing.seller);

    // Refund excess to buyer
    if (coin::value(&payment) > 0) {
        transfer::public_transfer(payment, ctx.sender());
    } else {
        coin::destroy_zero(payment);
    };

    // Extract item
    let item = option::extract(&mut listing.item);
    let item_id = object::id(&item);

    event::emit(ItemPurchased {
        listing_id: object::id(listing),
        item_id,
        price,
        seller: listing.seller,
        buyer: ctx.sender(),
        marketplace_fee,
    });

    item
}

/// Cancel a listing and reclaim the item
/// Only the original seller can cancel
public fun cancel<T: key + store>(listing: &mut Listing<T>, ctx: &mut TxContext): T {
    assert!(ctx.sender() == listing.seller, ENotSeller);
    assert!(option::is_some(&listing.item), EListingNotActive);

    let item = option::extract(&mut listing.item);
    let item_id = object::id(&item);

    event::emit(ItemDelisted {
        listing_id: object::id(listing),
        item_id,
        seller: listing.seller,
    });

    item
}

/// Update the price of a listing
/// Only the seller can update
public fun update_price<T: key + store>(
    listing: &mut Listing<T>,
    new_price: u64,
    ctx: &mut TxContext,
) {
    assert!(ctx.sender() == listing.seller, ENotSeller);
    assert!(option::is_some(&listing.item), EListingNotActive);

    let old_price = listing.price;
    listing.price = new_price;

    event::emit(PriceUpdated {
        listing_id: object::id(listing),
        old_price,
        new_price,
    });
}

// ============ View Functions ============

/// Get listing details: (price, seller, is_active)
public fun get_info<T: key + store>(listing: &Listing<T>): (u64, address, bool) {
    (listing.price, listing.seller, option::is_some(&listing.item))
}

/// Get listing price
public fun price<T: key + store>(listing: &Listing<T>): u64 {
    listing.price
}

/// Get listing seller
public fun seller<T: key + store>(listing: &Listing<T>): address {
    listing.seller
}

/// Check if listing is active
public fun is_active<T: key + store>(listing: &Listing<T>): bool {
    option::is_some(&listing.item)
}
