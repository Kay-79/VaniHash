/// Admin capabilities for the VaniHash protocol
module vanihash::admin;

/// Admin capability - grants administrative privileges
public struct AdminCap has key, store {
    id: UID,
}

/// Create a new admin capability (called during init)
public(package) fun new(ctx: &mut TxContext): AdminCap {
    AdminCap {
        id: object::new(ctx),
    }
}

/// Verify that the caller has admin capability
/// This function simply takes a reference to AdminCap to verify ownership
public fun verify(_admin: &AdminCap) {}
