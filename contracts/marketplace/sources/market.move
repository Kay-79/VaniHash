module marketplace::market;

use marketplace::config::{Self, MarketplaceConfig};
use sui::coin::{Self, Coin};
use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
use sui::sui::SUI;
use sui::transfer_policy::{TransferPolicy, TransferRequest};

/// Error codes
const EInsufficientPayment: u64 = 1;

/// Wrapper for kiosk::list
public fun list<T: key + store>(kiosk: &mut Kiosk, cap: &KioskOwnerCap, item_id: ID, price: u64) {
    kiosk::list<T>(kiosk, cap, item_id, price);
}

/// Wrapper for kiosk::delist
public fun delist<T: key + store>(kiosk: &mut Kiosk, cap: &KioskOwnerCap, item_id: ID) {
    kiosk::delist<T>(kiosk, cap, item_id);
}

/// Purchase function that returns TransferRequest for PTB to satisfy policy rules
///
/// Flow:
/// 1. Collects marketplace fee (2%) from payment
/// 2. Performs kiosk::purchase with remaining payment
/// 3. Returns (Item, TransferRequest) for caller to satisfy policy rules
/// 4. Refunds any excess to buyer
///
/// Caller PTB must:
/// 1. Satisfy all TransferPolicy rules (royalty, floor price, etc.)
/// 2. Call transfer_policy::confirm_request
/// 3. Transfer the item to buyer
#[allow(lint(self_transfer))]
public fun purchase<T: key + store>(
    kiosk: &mut Kiosk,
    item_id: ID,
    price: u64,
    mut payment: Coin<SUI>,
    _policy: &TransferPolicy<T>,
    marketplace_config: &MarketplaceConfig,
    ctx: &mut TxContext,
): (T, TransferRequest<T>) {
    // Calculate total required: price + marketplace fee
    let marketplace_fee = config::calculate_fee(marketplace_config, price);
    let total_required = price + marketplace_fee;
    assert!(coin::value(&payment) >= total_required, EInsufficientPayment);

    // Collect marketplace fee
    config::collect_fee(marketplace_config, &mut payment, price, ctx);

    // Split exact price for kiosk purchase
    let kiosk_payment = coin::split(&mut payment, price, ctx);

    // Perform kiosk purchase - returns item + TransferRequest hot potato
    let (item, request) = kiosk::purchase(kiosk, item_id, kiosk_payment);

    // Refund any remainder to buyer
    if (coin::value(&payment) > 0) {
        transfer::public_transfer(payment, ctx.sender());
    } else {
        coin::destroy_zero(payment);
    };

    // Return item + request for PTB to satisfy policy rules
    (item, request)
}
