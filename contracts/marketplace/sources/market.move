module marketplace::market;

use marketplace::royalty_rule;
use std::option;
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
use sui::object::{Self, UID};
use sui::sui::SUI;
use sui::transfer_policy::{Self, TransferPolicy};

/// Error codes
const EInsufficientPayment: u64 = 1;

/// Constants
const PROTOCOL_FEE_BPS: u64 = 500; // 5%

/// Admin Capability
public struct AdminCap has key, store { id: UID }

/// Shared object to collect fees
public struct FeeVault has key {
    id: UID,
    balance: Balance<SUI>,
}

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap { id: object::new(ctx) };
    transfer::public_transfer(
        admin_cap,
        @0x32ff5fdf9cb8be86dd9be6d5904717a1348b3917bc270305745e08123981ec30,
    );

    transfer::share_object(FeeVault {
        id: object::new(ctx),
        balance: balance::zero(),
    });
}

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
    vault: &mut FeeVault,
    ctx: &mut TxContext,
): T {
    // Check coverage
    let royalty_amount = royalty_rule::fee_amount(policy, price);
    let protocol_fee_amount = (price * PROTOCOL_FEE_BPS) / 10000;

    let total_required = price + royalty_amount + protocol_fee_amount;
    assert!(coin::value(&payment) >= total_required, EInsufficientPayment);

    // Split components
    let protocol_fee = coin::split(&mut payment, protocol_fee_amount, ctx);
    balance::join(&mut vault.balance, coin::into_balance(protocol_fee));

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

/// Admin: Withdraw accumulated fees
public entry fun withdraw_fees(_: &AdminCap, vault: &mut FeeVault, ctx: &mut TxContext) {
    let amount = balance::value(&vault.balance);
    let coin = coin::from_balance(balance::split(&mut vault.balance, amount), ctx);
    transfer::public_transfer(coin, ctx.sender());
}
