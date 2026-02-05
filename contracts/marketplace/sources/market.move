module marketplace::market;

use marketplace::royalty_rule;
use sui::coin::{Self, Coin};
use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
use sui::sui::SUI;
use sui::transfer_policy::{Self, TransferPolicy};

/// Error codes
const EInsufficientPayment: u64 = 1;

// Wrapper for kiosk::list
public fun list<T: key + store>(kiosk: &mut Kiosk, cap: &KioskOwnerCap, item_id: ID, price: u64) {
    kiosk::list<T>(kiosk, cap, item_id, price);
}

// Wrapper for kiosk::delist
public fun delist<T: key + store>(kiosk: &mut Kiosk, cap: &KioskOwnerCap, item_id: ID) {
    kiosk::delist<T>(kiosk, cap, item_id);
}

// Atomic Purchase function
// 1. Splits payment for Seller (Asset Price)
// 2. Splits payment for Royalty (Policy Rule)
// 3. Completes Kiosk Purchase
// 4. Pays Royalty and Confirms Request
// 5. Returns Item to Buyer
// 6. Refunds remaining gas/coin to Buyer
public fun purchase<T: key + store>(
    kiosk: &mut Kiosk,
    item_id: ID,
    price: u64,
    mut payment: Coin<SUI>,
    policy: &mut TransferPolicy<T>,
    ctx: &mut TxContext,
): T {
    // Check coverage
    let royalty_amount = royalty_rule::fee_amount(policy, price);

    let total_required = price + royalty_amount;
    assert!(coin::value(&payment) >= total_required, EInsufficientPayment);

    // Split components
    let kiosk_payment = coin::split(&mut payment, price, ctx);
    let royalty_payment = coin::split(&mut payment, royalty_amount, ctx);

    // Kiosk Purchase
    // This returns the Item and the "Hot Potato" TransferRequest
    let (item, mut request) = kiosk::purchase(kiosk, item_id, kiosk_payment);

    // Satisfy Royalty Rule
    royalty_rule::pay(policy, &mut request, royalty_payment);

    // Confirm Request (Consume Hot Potato)
    // If other rules exist, this will fail. We assume only Royalty Rule for this demo.
    transfer_policy::confirm_request(policy, request);

    // Refund remainder
    transfer::public_transfer(payment, ctx.sender());

    item
}
