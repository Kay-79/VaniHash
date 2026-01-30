module vanihash::marketplace;

use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;

/// Error codes
const EAmountIncorrect: u64 = 1;
const ENotOwner: u64 = 2;

/// Shared Listing Object
public struct Listing<T: key + store> has key, store {
    id: UID,
    seller: address,
    price: u64,
    item: T,
}

/// Events
public struct ItemListed<phantom T> has copy, drop {
    listing_id: ID,
    seller: address,
    price: u64,
}

public struct ItemSold<phantom T> has copy, drop {
    listing_id: ID,
    buyer: address,
    price: u64,
}

public struct ItemDelisted<phantom T> has copy, drop {
    listing_id: ID,
}

/// List an item for sale.
/// Shared object is created holding the item.
public fun list<T: key + store>(item: T, price: u64, ctx: &mut TxContext) {
    let id = object::new(ctx);
    let listing_id = object::uid_to_inner(&id);

    event::emit(ItemListed<T> {
        listing_id,
        seller: tx_context::sender(ctx),
        price,
    });

    let listing = Listing {
        id,
        seller: tx_context::sender(ctx),
        price,
        item,
    };

    transfer::share_object(listing);
}

/// Buy an item.
/// Takes Listing by value (consumes it), so it transfers item to buyer and deletes Listing.
/// MUST be called via PTB (not entry) because it takes shared object by value.
public fun buy<T: key + store>(listing: Listing<T>, payment: Coin<SUI>, ctx: &mut TxContext) {
    let Listing { id, seller, price, item } = listing;

    assert!(coin::value(&payment) == price, EAmountIncorrect);

    // 1. Pay Seller
    transfer::public_transfer(payment, seller);

    // 2. Give Item to Buyer
    transfer::public_transfer(item, tx_context::sender(ctx));

    // 3. Emit Event
    event::emit(ItemSold<T> {
        listing_id: object::uid_to_inner(&id),
        buyer: tx_context::sender(ctx),
        price,
    });

    // 4. Delete Listing
    object::delete(id);
}

/// Delist an item.
/// Only seller can call.
/// Takes Listing by value (consumes it).
public fun delist<T: key + store>(listing: Listing<T>, ctx: &mut TxContext) {
    let Listing { id, seller, price: _, item } = listing;

    assert!(seller == tx_context::sender(ctx), ENotOwner);

    // Return item to seller
    transfer::public_transfer(item, seller);

    event::emit(ItemDelisted<T> {
        listing_id: object::uid_to_inner(&id),
    });

    object::delete(id);
}
