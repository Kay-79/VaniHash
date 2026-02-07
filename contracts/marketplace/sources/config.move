module marketplace::config;

use sui::coin::{Self, Coin};
use sui::sui::SUI;

/// Error codes
const EInvalidBp: u64 = 1;

/// Admin capability for managing marketplace config
public struct AdminCap has key, store {
    id: UID,
}

/// Shared marketplace configuration
public struct MarketplaceConfig has key {
    id: UID,
    /// Marketplace fee in basis points (100 = 1%)
    fee_bp: u16,
    /// Address that receives marketplace fees
    beneficiary: address,
}

/// Initialize marketplace config with 2% fee (200 bp)
fun init(ctx: &mut TxContext) {
    let admin = AdminCap { id: object::new(ctx) };
    let config = MarketplaceConfig {
        id: object::new(ctx),
        fee_bp: 200, // 2%
        beneficiary: ctx.sender(),
    };

    transfer::transfer(admin, ctx.sender());
    transfer::share_object(config);
}

/// Update the marketplace fee (admin only via AdminCap ownership)
public fun set_fee(_: &AdminCap, config: &mut MarketplaceConfig, new_fee_bp: u16) {
    assert!(new_fee_bp <= 10000, EInvalidBp);
    config.fee_bp = new_fee_bp;
}

/// Update the beneficiary address
public fun set_beneficiary(_: &AdminCap, config: &mut MarketplaceConfig, new_beneficiary: address) {
    config.beneficiary = new_beneficiary;
}

/// Calculate marketplace fee for a given price
public fun calculate_fee(config: &MarketplaceConfig, price: u64): u64 {
    (((price as u128) * (config.fee_bp as u128) / 10000) as u64)
}

/// Split marketplace fee from payment and transfer to beneficiary
/// Returns the remaining coin after fee deduction
public fun collect_fee(
    config: &MarketplaceConfig,
    payment: &mut Coin<SUI>,
    price: u64,
    ctx: &mut TxContext,
) {
    let fee_amount = calculate_fee(config, price);
    if (fee_amount > 0) {
        let fee = coin::split(payment, fee_amount, ctx);
        transfer::public_transfer(fee, config.beneficiary);
    }
}

/// Get current fee in basis points
public fun fee_bp(config: &MarketplaceConfig): u16 {
    config.fee_bp
}

/// Get beneficiary address
public fun beneficiary(config: &MarketplaceConfig): address {
    config.beneficiary
}
